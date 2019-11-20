import React from "react";

import useAudioContext from "./useAudioContext.js";
import useMainMix from "./useMainMix.js";
import { useSequenceState } from "./Sequence.js";

import { Keyboard } from "./Keyboard.js";
import PatchEditor from "./PatchEditor.js";
import { LinearScaleUnitInput } from "./input.js";
import { Percentage } from "./string.js";
import { Sequencer } from "./Sequencer.js";

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
        <LinearScaleUnitInput value={level} onChange={(value) => setLevel(value)} />{' '}{Percentage(level)}
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
