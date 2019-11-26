import React from "react";

import useAudioContext from "./useAudioContext.js";
import useMainMix from "./useMainMix.js";
import { useSequenceState } from "./Sequence.js";

import { Keyboard } from "./Keyboard.js";
import PatchEditor from "./PatchEditor.js";
import { LinearScaleUnitInput } from "./input.js";
import { Percentage } from "./string.js";
import { Sequencer } from "./Sequencer.js";
import { PhraseEditor } from "./Phrase.js";

function App() {
  const audioContext = useAudioContext();
  const [level, setLevel, destination] = useMainMix(audioContext);

  const [
    [sequence, setSequence],
    [selectedTrack, selectTrack, setSelectedTrack],
    [selectedPhrase, selectPhrase, setSelectedPhrase],
    [selectedPitch, selectPitch, setSelectedPitch],
    [selectedPatch, selectPatch, setSelectedPatch],
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
      />

      <h2>Phrase</h2>
      <p>
        Track:{' '}
        <select onChange={(e) => selectTrack(parseInt(e.target.value, 10))}>
          {sequence.tracks.map((track, trackIndex) => {
            return (
              <option key={trackIndex} value={trackIndex}>{track.name}</option>
            );
          })}
        </select>
      </p>
      <p>
        Phrase:{' '}
        <select onChange={(e) => selectPhrase(e.target.value)}>
          {Object.entries(selectedTrack.phrases).map(([phraseId, phrase]) => {
            return (
              <option key={phraseId} value={phraseId}>{phrase.name} ({phraseId})</option>
            );
          })}
        </select>
      </p>
      <PhraseEditor phrase={selectedPhrase} setPhrase={setSelectedPhrase} />

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

      <h2>Keyboard</h2>
      <Keyboard audioContext={audioContext} destination={destination} selectedTrack={selectedTrack} />
    </div>
  );
}

export default App;
