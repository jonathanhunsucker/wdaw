import React, { useRef, useState, useEffect } from "react";

import { silentPingToWakeAutoPlayGates } from "@jonathanhunsucker/audio-js";

import Beat from "./music/Beat.js";
import useExcisedUponRemovalList from "./useExcisedUponRemovalList.js";
import { flatten, rationalEquals, rationalDifference, rationalGreater, rationalLessEqual } from "./math.js";

import { Hit } from "./Sequence.js";

import useInterval from "./useInterval.js";
import Checkbox from "./Checkbox.js";

function usePlayer(audioContext, destination, sequence) {
  const [currentBeat, setCurrentBeat] = useState(new Beat(1, [0, 0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const exciseByPolicyAndAppend = useExcisedUponRemovalList((expiration) => expiration.expire());

  const all = (expiration) => true;
  const expired = (expiration) => expiration.expiresBy(audioContext.currentTime);

  useInterval(() => {
    // BUG timing is off when the main thread is locked up, eg. when doing lots of re-renders
    // FIXIDEA keep track of main thread utilization, and spend time optimizing it when it gets bad
    // FIXIDEA replacement setTimeout-based timing with scheduled playing
    const newPendingExpirations = sequence.play(audioContext, destination, currentBeat);
    exciseByPolicyAndAppend(expired, newPendingExpirations);

    const nextBeat = currentBeat.plus(sequence.tickSize, sequence.timeSignature);
    setCurrentBeat(nextBeat);
  }, isPlaying ? sequence.secondsPerBeat() / sequence.divisions * 1000 : null);

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

export const Sequencer = React.memo(function Sequencer(props) {
  const sequence = props.sequence;

  const [
    currentBeat,
    [isPlaying, playerSetIsPlaying],
  ] = usePlayer(props.audioContext, props.destination, sequence);

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
        toAdd.push(new Hit(note, beat, track.defaultHitDuration));
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

    props.setSequence(
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
    props.setSequence(sequence.setTempo(newTempo));
  }

  function setIsPlaying(newIsPlaying) {
    silentPingToWakeAutoPlayGates(props.audioContext);
    playerSetIsPlaying(newIsPlaying);
  }

  const cellStyles = {borderStyle: 'ridge'};
  const currentBeatStyles = Object.assign({}, {backgroundColor: 'lightgrey'}, cellStyles);
  const rightAlignStyles = Object.assign({}, {textAlign: 'right'}, cellStyles);

  return (
    <React.Fragment>
      <p><button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'pause' : 'play'}</button></p>
      <p><input type="number" value={sequence.tempo} onChange={(e) => setTempo(parseInt(e.target.value, 10))} /></p>
      <table className="Sequencer" style={{borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th style={cellStyles}></th>
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
              track.notes.map((note, index) =>
                <tr key={note.pitch}>
                  {index === 0 && <td style={cellStyles} rowSpan={track.notes.length}>
                    <input
                      type="radio"
                      id={`track-${trackIndex}`}
                      value={trackIndex}
                      checked={trackIndex === props.selectedTrack}
                      onChange={(e) => {props.setSelectedTrack(parseInt(e.target.value, 10));}}
                    />{' '}
                    <label htmlFor={`track-${trackIndex}`}>{track.name}</label>
                  </td>}
                  <td style={rightAlignStyles}>{note.pitch}</td>
                  {sequence.beats.map((beat) =>
                    <td key={beat.key} style={currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                      <Checkbox
                        value={hitValue(track, note, beat)}
                        onChange={(value) => toggleHit(track, note, beat, value)}
                      />
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

