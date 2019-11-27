import React, { useRef, useState, useEffect, useMemo } from "react";

import { silentPingToWakeAutoPlayGates } from "@jonathanhunsucker/audio-js";

import Beat from "./music/Beat.js";

import useExcisedUponRemovalList from "./useExcisedUponRemovalList.js";
import useInterval from "./useInterval.js";

import { range, flatten, rationalAsFloat, rationalEquals, rationalSum, rationalDifference, rationalGreater, rationalLessEqual } from "./math.js";

import Checkbox from "./Checkbox.js";

import { buildCellStyles } from "./styles.js";

const { cellStyles, currentBeatStyles, rightAlignStyles } = buildCellStyles({ minWidth: '1vw'});

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
  const lastTickedAtRef = useRef({time: null, beat: null});
  const lastScheduledAtRef = useRef({time: null, beat: null}); // farthest out in time we've seen
  const lookaheadInSeconds = .500;

  useWebAudioAPIClock(audioContext, () => {
    if (isPlaying === false) {
      return;
    }

    const now = audioContext.currentTime;
    const divisionDurationInSeconds = sequence.secondsPerBeat() / sequence.divisions;
    const relativeAdvancementInSeconds = now - lastTickedAtRef.current.time;

    const shouldPlayNextBeat = divisionDurationInSeconds < relativeAdvancementInSeconds;
    if (shouldPlayNextBeat) {
      const latestBeat = currentBeat.plus(sequence.tickSize);
      if (!latestBeat.modulo(sequence.timeSignature).equals(latestBeat)) {
        setIsPlaying(false);
        return;
      }

      setCurrentBeat(latestBeat);
    }

    const horizonTime = now + lookaheadInSeconds;
    const toSchedule = [];
    while (true) {
      const beat = lastScheduledAtRef.current.beat !== null ? lastScheduledAtRef.current.beat.plus(sequence.tickSize) : new Beat(1, [0, 0]);
      const at = lastScheduledAtRef.current.time !== null ? lastScheduledAtRef.current.time + divisionDurationInSeconds : 0;

      if (at >= horizonTime) {
        break;
      }

      const scheduled = { beat: beat, time: at };
      toSchedule.push(scheduled);
      lastScheduledAtRef.current = scheduled;
    }

    toSchedule.map(({beat, time}) => {
      const newPendingExpirations = sequence.schedule(audioContext, destination, beat, time);
      exciseByPolicyAndAppend(expired, newPendingExpirations);
    });
  });

  const [currentBeat, setCurrentBeatInternal] = useState(null);
  const setCurrentBeat = (beat) => {
    lastTickedAtRef.current = {time: audioContext.currentTime, beat: beat};
    setCurrentBeatInternal(beat);
  };
  const [isPlaying, setIsPlayingInternal] = useState(false);
  const setIsPlaying = (isPlaying) => {
    if (isPlaying) {
      const beat = currentBeat === null ? new Beat(1, [0, 0]) : currentBeat.plus(sequence.tickSize);
      setCurrentBeat(beat);
      lastScheduledAtRef.current = {time: audioContext.currentTime, beat: null};
    } else {
      setCurrentBeat(new Beat(1, [0, 0]));
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

export const Sequencer = React.memo(function Sequencer({ audioContext, destination, sequence, setSequence }) {
  const [
    currentBeat,
    [isPlaying, playerSetIsPlaying],
  ] = usePlayer(audioContext, destination, sequence);

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
              <th key={beat.key} style={currentBeat && currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
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
                    <label htmlFor={`track-${trackIndex}`}>{track.name}</label>
                  </td>}
                  {sequence.beats.map((beat) => {
                    const period = track.getPeriodFromPlacement(placement);

                    if (!period.beginsOn(beat) && period.spans(beat)) {
                      return null;
                    }

                    const colSpan = period.beginsOn(beat) ? rationalAsFloat(period.duration) / rationalAsFloat(sequence.tickSize) : 1;
                    return (
                      <td key={beat.key} colSpan={colSpan} style={currentBeat && currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                        {period.beginsOn(beat) ? placement.phraseId : null}
                      </td>
                    );
                  })}
                </tr>
              )
            );
          })}
        </tbody>
      </table>
    </React.Fragment>
  );
});


