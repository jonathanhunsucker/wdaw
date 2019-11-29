import React from "react";

import { assert, is, any, none, aNonZeroLengthString, Matcher } from "@/utility/type.js";

import Track from "@/composition/Track.js";

import { synth, hat } from "@/repository/Patches.js";
import { emptyKeysPhrase, emptyDrumsPhrase } from "@/repository/Phrases.js";

import PhraseEditor from "@/user-interface/PhraseEditor/index.js";
import PatchEditor from "@/user-interface/PatchEditor/index.js";
import Keyboard from "@/user-interface/Keyboard/index.js";

import useSelectionState from "../useSelectionState.js";

export default function TrackEditor(props) {
  return (<>
    <Arrangement {...props} />
    <Voicing {...props} />
  </>);
}

function validPhraseNameForTrack(track) {
  return new Matcher((value) => {
    aNonZeroLengthString().enforce(value);
    none(Object.keys(track.phrases).map((phraseId) => is(phraseId))).enforce(value);
    return true;
  });
}

function Arrangement({ audioContext, destination, track, setTrack }) {
  const [selectedPhraseId, selectPhraseId] = useSelectionState(track.phrases, (phrases) => Object.keys(phrases));
  const selectedPhrase = selectedPhraseId !== null ? track.phrases[selectedPhraseId] : null;

  function addPhrase() {
    if (track.kind === Track.KIND_KEYS) {
      const name = prompt('name', 'untitled key phrase');
      assert(name, validPhraseNameForTrack(track));
      setTrack(track.setPhrase(name, emptyKeysPhrase));
    } else if (track.kind === Track.KIND_DRUMS) {
      setTrack(track.setPhrase(prompt('name', 'untitled drum phrase'), emptyDrumsPhrase));
    } else {
      throw new Error(`Unknown track kind ${track.kind}`);
    }
  }

  function setSelectedPhrase(replacement) {
    setTrack(track.setPhrase(selectedPhraseId, replacement));
  }

  return (<>
    <h4>Phrase</h4>
    <p>
      Phrase:{' '}
      <select value={selectedPhraseId || ''} onChange={(e) => selectPhraseId(e.target.value)}>
        {Object.keys(track.phrases).map((phraseId) => {
          return (
            <option key={phraseId} value={phraseId}>{phraseId}</option>
          );
        })}
      </select>
    </p>
    <p><button onClick={() => addPhrase()}>Add phrase</button></p>
    {selectedPhrase !== null ? (<PhraseEditor phrase={selectedPhrase} setPhrase={setSelectedPhrase} />) : 'no phrase selected'}

    <h4>Placement</h4>
    <p>TODO</p>
  </>);
}

function Voicing({ audioContext, destination, track, setTrack }) {
  const [selectedPitch, selectPitch] = useSelectionState(track.patches, (patches) => Object.keys(patches));
  const selectedPatch = selectedPitch !== null ? track.patchForPitch(selectedPitch) : null;

  function addPatch() {
    if (track.kind === Track.KIND_KEYS) {
      setTrack(track.setPatch('*', synth()));
    } else if (track.kind === Track.KIND_DRUMS) {
      const pitch = prompt('Pitch', null);
      if (!any([is('Kick'), is('Snare'), is('ClosedHat')]).matches(pitch)) {
        throw new Error(`Unknown pitch ${pitch}`);
      }
      setTrack(track.setPatch(pitch, {'Kick': hat(), 'Snare': hat(), 'ClosedHat': hat()}[pitch]));
    } else {
      throw new Error(`Unknown track kind ${track.kind}`);
    }
  }

  return (<>
    <h4>Patch</h4>
    <p>
      Patch:{' '}
      <select value={selectedPitch || ''} onChange={(e) => selectPitch(e.target.value)}>
        {Object.keys(track.patches).map((pitch) => {
          return (
            <option key={pitch} value={pitch}>{pitch}</option>
          );
        })}
      </select>
    </p>
    <p><button onClick={() => addPatch()}>Add patch</button></p>

    <p>TODO patch editor</p>

    <h4>Keyboard</h4>
    <Keyboard audioContext={audioContext} destination={destination} track={track} />
  </>);
}
