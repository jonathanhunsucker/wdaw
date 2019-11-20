import React, { Component, useState, useEffect, useRef, useMemo } from "react";

import { Gain, Binding } from "@jonathanhunsucker/audio-js";

import { DumpJson } from "./debug.js";
import { key, offset, Keyboard } from "./Keyboard.js";
import PatchEditor, { ScaledInput } from "./PatchEditor.js";
import { Percentage } from "./string.js";
import { Sequence, Hit, Percussion, useSequenceState } from "./Sequence.js";
import { Sequencer } from "./Sequencer.js";

function useAudioContext() {
  const value = useMemo(() => {
    return new (window.webkitAudioContext || window.AudioContext)();
  });
  const ref = useRef(value);
  return ref.current;
}

function useMainMix(audioContext) {
  const [level, setLevel] = useState(0.3);

  const destination = useMemo(() => {
    return (new Binding(
      new Gain(level),
      null,
      []
    )).play(audioContext, audioContext.destination);
  }, [level, audioContext]);

  return [
    level,
    setLevel,
    destination,
  ];
}

function App() {
  const audioContext = useAudioContext();
  const [level, setLevel, destination] = useMainMix(audioContext);

  const [
    [sequence, setSequence],
    [selectedTrack, setSelectedTrack],
    [selectedPitch, setSelectedPitch],
    [selectedPatch, setSelectedPatch],
  ] = useSequenceState();

  return (
    <div className="App">
      <h1>Workstation</h1>
      <p>Level:{' '}
        <ScaledInput
          base={1}
          value={level} min={0} max={1}
          onChange={(value) => setLevel(value)}
        />{' '}{Percentage(level)}
      </p>

      <h2>Sequencer</h2>
      <Sequencer
        audioContext={audioContext}
        destination={destination}
        sequence={sequence}
        setSequence={setSequence}
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
        selectedPitch={selectedPitch}
        setSelectedPitch={setSelectedPitch}
      />

      <h2>Patch</h2>
      <PatchEditor patch={selectedPatch} setPatch={setSelectedPatch} />

      <h2>Keyboard</h2>
      <Keyboard audioContext={audioContext} destination={destination} selectedTrack={selectedTrack} />
    </div>
  );
}

export default App;
