import React, { useRef, useState, useEffect, useMemo } from "react";

import { silentPingToWakeAutoPlayGates } from "@jonathanhunsucker/audio-js";

import Beat from "./music/Beat.js";
import useExcisedUponRemovalList from "./useExcisedUponRemovalList.js";
import { range, flatten, rationalAsFloat, rationalEquals, rationalSum, rationalDifference, rationalGreater, rationalLessEqual } from "./math.js";

import { UniversalNoteParser, Hit } from "./Sequence.js";

import useInterval from "./useInterval.js";
import Checkbox from "./Checkbox.js";

import { cellStyles, currentBeatStyles, rightAlignStyles } from "./styles.js";

function useWebAudioAPIClock(context, tick) {
  const tickReference = useRef();
  tickReference.current = tick;
  const node = useMemo(() => {
    // BUG createScriptProcessor is a deprecated API
    const node = context.createScriptProcessor(256, 1, 1);
    node.connect(context.destination);
    node.onaudioprocess = () => tickReference.current();
    return node;
  }, [context, tick]);
  const clock = useRef(node);
}


function usePlayer(audioContext, destination, sequence) {
  const startedAtRef = useRef();
  const lastTickedAtRef = useRef(0);

  useWebAudioAPIClock(audioContext, () => {
    if (isPlaying === false) {
      return;
    }

    const now = audioContext.currentTime;
    const divisionDurationInSeconds = sequence.secondsPerBeat() / sequence.divisions;
    const shouldPlayNextBeat = divisionDurationInSeconds < now - lastTickedAtRef.current;

    if (shouldPlayNextBeat === false) {
      return;
    }

    lastTickedAtRef.current = now;

    const newPendingExpirations = sequence.play(audioContext, destination, currentBeat);
    exciseByPolicyAndAppend(expired, newPendingExpirations);

    setCurrentBeat(currentBeat.plus(sequence.tickSize, sequence.timeSignature));
  });

  const [currentBeat, setCurrentBeat] = useState(new Beat(1, [0, 0]));
  const [isPlaying, setIsPlayingInternal] = useState(false);
  const setIsPlaying = (isPlaying) => {
    if (isPlaying === true) {
      startedAtRef.current = audioContext.currentTime;
    }

    setIsPlayingInternal(isPlaying);
  };
  const exciseByPolicyAndAppend = useExcisedUponRemovalList((expiration) => expiration.expire());

  const all = (expiration) => true;
  const expired = (expiration) => expiration.expiresBy(audioContext.currentTime);

  return [
    currentBeat,
    [
      isPlaying,
      (newIsPlaying) => {
        // sometimes when pausing, notes are left playing
        exciseByPolicyAndAppend(all, []);
        setIsPlaying(newIsPlaying);
      },
    ],
  ];
}

export const Sequencer = React.memo(function Sequencer({ audioContext, destination, sequence, setSequence, selectedTrack, setSelectedTrack, selectedPitch, setSelectedPitch }) {

  const [
    currentBeat,
    [isPlaying, playerSetIsPlaying],
  ] = usePlayer(audioContext, destination, sequence);

  function hitValue(track, note, beat) {
    const spanningHit = track.findHits({spans: beat, note: note})[0]
    if (spanningHit) {
      return spanningHit.beginsOn(beat) ? true : 'indeterminate';
    } else {
      if (track.findHits({beginningOn: beat, note: note})[0]) {
        return true;
      }
      return false;
    }
  }

  function toggleHit(track, note, beat, value) {
    if (track.supports('sustain') === false && value === 'indeterminate') {
      return;
    }

    let spanningHit = track.findHits({spans: beat, note: note})[0];
    if (track.supports('sustain') === false && !spanningHit) {
      spanningHit = track.findHits({beginningOn: beat, note: note})[0];
    }

    const toRemove = [];
    const toAdd = [];

    if (value === true) {
      // add a note on beat
      if (spanningHit) {
        throw new Error('tried to add note to beat which is already spanned');
      } else {
        toAdd.push(new Hit(note, beat, track.getDefaultHitDuration()));
      }
    } else if (value === 'indeterminate') {
      // sustain an existing note further
      const endsBeforeBeat = track.hits.filter((hit) => {
        return hit.note.equals(note) && rationalLessEqual(hit.endingAsRational(), beat.toRational());
      });

      const hitWithClosestEnd = endsBeforeBeat.reduce((lastSoFar, candidate) => {
        if (lastSoFar === null) {
          return candidate;
        }

        const shouldTakeCandidate = rationalGreater(candidate.endingAsRational(), lastSoFar.endingAsRational());
        return shouldTakeCandidate ? candidate : lastSoFar;
      }, null);

      const duration = rationalDifference(
        // BUG plus wraps modulo timeSignature, causing an negative difference, which explodes
        // IDEA separate modulo behavior into a helper, leaving plus to do straight math
        // IDEA replace plus with context-specific addition behavior, optionally employing modulo (where applicable to context)
        beat.plus(sequence.tickSize, sequence.timeSignature).toRational(),
        hitWithClosestEnd.beginningAsRational()
      );
      const adjusted = hitWithClosestEnd.adjustDurationTo(duration);

      toRemove.push(spanningHit);
      toAdd.push(adjusted);
    } else if (value === false) {
      // remove a hit, or shorten it
      if (spanningHit) {
        toRemove.push(spanningHit);
        if (spanningHit.beginsOn(beat) === false) {
          const duration = rationalDifference(beat.toRational(), spanningHit.beginningAsRational());
          const adjusted = spanningHit.adjustDurationTo(duration);
          toAdd.push(adjusted);
        }
      } else {
        throw new Error('tried to remove a note for which no spanning hit could be found');
      }
    }

    setSequence(
      sequence.replaceTrack(
        track,
        toAdd.reduce(
          (track, hit) => track.add(hit),
          toRemove.reduce((track, hit) => track.without(hit), track)
        )
      )
    );
  }

  function setTempo(newTempo) {
    setSequence(sequence.setTempo(newTempo));
  }

  function setIsPlaying(newIsPlaying) {
    silentPingToWakeAutoPlayGates(audioContext);
    playerSetIsPlaying(newIsPlaying);
  }

  return (
    <React.Fragment>
      <p><button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'pause' : 'play'}</button></p>
      <p>Tempo: <input type="number" value={sequence.tempo} onChange={(e) => setTempo(parseInt(e.target.value, 10))} /></p>
      <table style={{borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th style={cellStyles}></th>
            {sequence.beats.map((beat) =>
              <th key={beat.key} style={currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                {rationalEquals(beat.rational, [0, 0]) ? beat.beat : ''}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sequence.tracks.map((track, trackIndex) => {
            return flatten(
              track.placements.map((placement, index) =>
                <tr key={index}>
                  {index === 0 && <td style={cellStyles} rowSpan={track.placements.length}>
                    <input
                      type="radio"
                      id={`track-${trackIndex}`}
                      checked={track === selectedTrack}
                      onChange={() => setSelectedTrack(track)}
                    />{' '}
                    <label htmlFor={`track-${trackIndex}`}>{track.name}</label>
                  </td>}
                  {sequence.beats.map((beat) =>
                    <td key={beat.key} style={currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                      {placement.period.spans(beat) ? '#' : '_'}
                    </td>
                  )}
                </tr>
              )
            );
          })}
        </tbody>
      </table>
    </React.Fragment>
  );
});


