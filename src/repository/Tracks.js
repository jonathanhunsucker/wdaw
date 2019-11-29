import Track from "@/composition/Track.js";

import { synth, hat, snare } from "./Patches.js";

export const emptyDrumTrack = new Track('Untitled drum track', 'drums', {}, [], []);
export const emptyKeyTrack = new Track('Untitled key track', 'keys', {}, [], []);

export const defaultDrumTrack = emptyDrumTrack
  .setPatch('ClosedHat', hat())
  .setPatch('Kick', hat())
  .setPatch('Snare', snare());

export const defaultKeyTrack = emptyKeyTrack
  .setPatch('*', synth());
