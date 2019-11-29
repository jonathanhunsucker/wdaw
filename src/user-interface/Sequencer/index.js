import React from "react";

import { silentPingToWakeAutoPlayGates } from "@jonathanhunsucker/audio-js";

import { flatten } from "@/utility/math.js";

import BarsBeatsSixteenths from "@/music/BarsBeatsSixteenths.js";

import { defaultDrumTrack, defaultKeyTrack } from "@/repository/Tracks.js";

import { buildCellStyles } from "../style.js";

import usePlayer from "./usePlayer.js";

const { cellStyles, currentBeatStyles, rightAlignStyles } = buildCellStyles({ minWidth: '1vw'});

const Sequencer = React.memo(function Sequencer({ audioContext, destination, sequence, setSequence }) {
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
                {beat.isRound() ? beat.beats : ''}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sequence.tracks.map((track, trackIndex) => {
            return (
              <tr key={`${trackIndex}`}>
                <td style={cellStyles}>{track.name}</td>
                <td style={cellStyles} colSpan={sequence.beats.length}></td>
              </tr>
            ); [].concat(flatten(
              track.placements.map((placement, index) =>
                <tr key={`${trackIndex}-${index}`}>
                  {index === 0 && <td style={cellStyles} rowSpan={track.placements.length}>
                    <label htmlFor={`track-${trackIndex}`}>{track.name}</label>
                  </td>}
                  {sequence.beats.map((beat) => {
                    const period = track.getPeriodFromPlacement(placement);

                    if (!period.beginsOn(beat) && period.spans(beat)) {
                      return null;
                    }

                    const colSpan = period.beginsOn(beat) ? period.divide(sequence.tickSize) : 1;
                    return (
                      <td key={beat.key} colSpan={colSpan} style={currentBeat && currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                        {period.beginsOn(beat) ? placement.phraseId : ''}
                      </td>
                    );
                  })}
                </tr>
              )
            ));
          })}
        </tbody>
      </table>
      <p><button onClick={() => setSequence(sequence.addTrack(defaultDrumTrack))}>Add drum track</button></p>
      <p><button onClick={() => setSequence(sequence.addTrack(defaultKeyTrack))}>Add key track</button></p>
    </React.Fragment>
  );
});

export default Sequencer;
