import React, { useState, useEffect, useRef } from "react";

import { Percentage } from "@/utility/string.js";
import { range } from "@/utility/math.js";

import { emptySequence, defaultSequence, basicSequence, timingExerciseSequence } from "@/repository/Sequences.js";

import { LinearScaleUnitInput } from "@/user-interface/input.js";
import Sequencer from "@/user-interface/Sequencer/index.js";
import TrackEditor from "@/user-interface/TrackEditor/index.js";

import useAudioContext from "./useAudioContext.js";
import useMainMix from "./useMainMix.js";

import useSelectionState from "../useSelectionState.js";

function App() {
  const audioContext = useAudioContext();
  const [level, setLevel, destination] = useMainMix(audioContext);

  const [sequence, setSequence] = useState(basicSequence());
  const [selectedTrackIndex, selectTrackIndex] = useSelectionState(sequence.tracks, (tracks) => tracks.length > 0 ? range(0, tracks.length) : []);
  const selectedTrack = sequence.tracks[selectedTrackIndex] || null;

  function setSelectedTrack(newTrack) {
    setSequence(sequence.replaceTrack(selectedTrack, newTrack));
  }

  return (
    <div className="App">
      <h1>WDAW</h1>
      <p>Project by <a href="https://jonathanhunsucker.com">Jonathan Hunsucker</a></p>
      <p>Level:{' '}
        <LinearScaleUnitInput value={level} onChange={(value) => setLevel(value)} />{' '}{Percentage(level)}
      </p>

      <h2>Sequencer</h2>
      <Sequencer audioContext={audioContext} destination={destination} sequence={sequence} setSequence={setSequence} />

      {selectedTrack === null ? null : <>
        <h3>Track</h3>
        <p>
          Track:{' '}
          <select value={sequence.tracks.indexOf(selectedTrack)} onChange={(e) => selectTrackIndex(parseInt(e.target.value, 10))}>
            {sequence.tracks.map((track, trackIndex) => {
              return (
                <option key={trackIndex} value={trackIndex}>{track.name}</option>
              );
            })}
          </select>
        </p>

        <TrackEditor audioContext={audioContext} destination={destination} track={selectedTrack} setTrack={setSelectedTrack} />
      </>}
    </div>
  );
}

/*
      <h2>Patch</h2>
      <p>
        Pitch:{' '}
        <select onChange={(e) => selectPitch(e.target.value)}>
          {Object.entries(selectedTrack.patches).map(([pitch, patch]) => {
            return (
              <option key={pitch} value={pitch}>{pitch}</option>
            );
          })}
        </select>
      </p>
      <PatchEditor patch={selectedPatch} setPatch={setSelectedPatch} />
      */

export default App;
