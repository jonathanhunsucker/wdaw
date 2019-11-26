import React, { useRef, useState, useEffect, useMemo } from "react";

import { silentPingToWakeAutoPlayGates } from "@jonathanhunsucker/audio-js";

import Beat from "./music/Beat.js";
import useExcisedUponRemovalList from "./useExcisedUponRemovalList.js";
import { range, flatten, rationalAsFloat, rationalEquals, rationalSum, rationalDifference, rationalGreater, rationalLessEqual } from "./math.js";

import { UniversalNoteParser, Hit } from "./Sequence.js";

import useInterval from "./useInterval.js";
import Checkbox from "./Checkbox.js";

import { buildCellStyles } from "./styles.js";

const { cellStyles, currentBeatStyles, rightAlignStyles } = buildCellStyles({});

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

    setCurrentBeat(currentBeat.plus(sequence.tickSize).modulo(sequence.timeSignature));
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
                    <label htmlFor={`track-${trackIndex}`}>{track.name}</label>
                  </td>}
                  {sequence.beats.map((beat) =>
                    <td key={beat.key} style={currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                      {track.getPeriodFromPlacement(placement).spans(beat) ? '#' : '_'}
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


