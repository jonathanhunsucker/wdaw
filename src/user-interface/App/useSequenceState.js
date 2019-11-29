import { useState } from "react";

import { Gain, Envelope, Wave, Filter, Noise } from "@jonathanhunsucker/audio-js";

import { assert, instanceOf, anInteger, aString, any } from "@/utility/type.js";

import { aPatch } from "@/audio/Patch.js";

import { empty } from "@/repository/Sequences.js";

import Track from "@/composition/Track.js";
import Phrase from "@/composition/Phrase.js";

const defaultSequence = empty();
const defaultTrackFromSequence = (sequence) => {
  return 0;
};
const defaultPhraseFromTrack = (track) => {
  const phraseIds = Object.keys(track.phrases);
  if (phraseIds.length === 0) {
    return null;
  }

  return phraseIds[0];
};
const defaultPitchFromTrack = (track) => Object.keys(track.patches)[0];
const defaultPatchFromTrack = (track) => Object.entries(track.patches)[0][1];

export default function useSequenceState() {
  const [state, setState] = useState({
    sequence: defaultSequence,
    selectedTrack: defaultTrackFromSequence(defaultSequence),
    selectedPhrase: defaultPhraseFromTrack(defaultSequence.tracks[defaultTrackFromSequence(defaultSequence)]),
    selectedPitch: defaultPitchFromTrack(defaultSequence.tracks[defaultTrackFromSequence(defaultSequence)]),
  });
  const selectedTrack = state.sequence.tracks[state.selectedTrack];
  const selectedPatch = selectedTrack.patchForPitch(state.selectedPitch);
  const selectedPhrase = selectedTrack.phrases[state.selectedPhrase];

  const setSequence = (replacementSequence) => {
    setState({
      sequence: replacementSequence,
      selectedTrack: state.selectedTrack,
      selectedPhrase: selectedTrack.phrases.hasOwnProperty(state.selectedPhrase) ? state.selectedPhrase : defaultPhraseFromTrack(selectedTrack),
      selectedPitch: Object.keys(selectedTrack.patches).includes(state.selectedPitch) ? state.selectedPitch : defaultPitchFromTrack(selectedTrack),
    });
  };

  const selectTrack = (index) => {
    assert(index, anInteger());
    const newlySelectedTrack = state.sequence.tracks[index];
    assert(newlySelectedTrack, instanceOf(Track));

    setState({
      sequence: state.sequence,
      selectedTrack: state.sequence.tracks.indexOf(newlySelectedTrack),
      selectedPhrase: defaultPhraseFromTrack(newlySelectedTrack),
      selectedPitch: defaultPitchFromTrack(newlySelectedTrack),
    });
  };

  const setSelectedTrack = (replacementTrack) => {
    setSequence(state.sequence.replaceTrack(selectedTrack, replacementTrack));
  };

  const selectPhrase = (newlySelectedPhraseId) => {
    assert(newlySelectedPhraseId, aString());
    const newlySelectedPhrase = selectedTrack.phrases[newlySelectedPhraseId];
    assert(newlySelectedPhrase, instanceOf(Phrase));

    setState({
      sequence: state.sequence,
      selectedTrack: state.selectedTrack,
      selectedPhrase: newlySelectedPhraseId,
      selectedPitch: state.selectedPitch,
    });
  };

  const setSelectedPhrase = (updatedPhrase) => {
    const updatedTrack = selectedTrack.replacePhrase(selectedPhrase, updatedPhrase);
    setSequence(state.sequence.replaceTrack(selectedTrack, updatedTrack));
  };

  const selectPitch = (newlySelectedPitch) => {
    assert(newlySelectedPitch, aString());
    const newlySelectedPatch = selectedTrack.patches[newlySelectedPitch];
    assert(newlySelectedPatch, aPatch());

    setState({
      sequence: state.sequence,
      selectedTrack: state.selectedTrack,
      selectedPhrase: state.selectedPhrase,
      selectedPitch: newlySelectedPitch,
    });
  };

  const setSelectedPitch = (replacementPitch) => {
    setState({
      sequence: state.sequence,
      selectedTrack: state.selectedTrack,
      selectedPhrase: state.selectedPhrase,
      selectedPitch: replacementPitch,
    });
  };

  const setSelectedPatch = (patch) => {
    const replacementSequence = state.sequence.replaceTrack(
      selectedTrack,
      selectedTrack.replacePatch(selectedPatch, patch)
    );
    setState({
      sequence: replacementSequence,
      selectedTrack: state.selectedTrack,
      selectedPhrase: state.selectedPhrase,
      selectedPitch: state.selectedPitch,
    });
  };

  assert(selectedTrack, instanceOf(Track));
  assert(selectedPhrase, instanceOf(Phrase));
  return [
    [state.sequence, setSequence],
    [selectedTrack, selectTrack, setSelectedTrack],
    [selectedPhrase, selectPhrase, setSelectedPhrase],
    [state.selectedPitch, selectPitch, setSelectedPitch],
    [selectedPatch, () => {}, setSelectedPatch],
  ];
};
