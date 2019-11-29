import React from "react";

import { assert, is, any } from "@/utility/type.js";

import Track from "@/composition/Track.js";

import { synth, hat } from "@/repository/Patches.js";

import Keyboard from "@/user-interface/Keyboard/index.js";

import useSelectionState from "../useSelectionState.js";

export default function TrackEditor({ audioContext, destination, track, setTrack }) {
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

    <h4>Keyboard</h4>
    <Keyboard audioContext={audioContext} destination={destination} track={track} />
  </>);
}
