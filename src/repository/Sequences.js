import BarsBeatsSixteenths from "@/music/BarsBeatsSixteenths.js";
import TimeSignature from "@/music/TimeSignature.js";

import Placement from "@/composition/Placement.js";
import Track from "@/composition/Track.js";
import Sequence from "@/composition/Sequence.js";

import { hat, snare } from "./Patches.js";
import { cMinorToUpperC, cMinor, keyTick, drumTick, march } from "./Phrases.js";
import { emptyDrumTrack, defaultDrumTrack, emptyKeyTrack, defaultKeyTrack } from "./Tracks.js";

export const emptySequence = () => new Sequence(120, [], new TimeSignature(4, 4));

export const defaultSequence = () => emptySequence().addTrack(defaultKeyTrack.setPhrase('cMinorToUpperC', cMinorToUpperC())).addTrack(defaultDrumTrack);

export const basic = () => {
  const keys = defaultKeyTrack
    .setPhrase('cMinorToUpperC', cMinorToUpperC())
    .setPhrase('cMinor', cMinor())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'cMinorToUpperC'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'cMinor'));

  const drums = defaultDrumTrack
    .setPhrase('march', march())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'march'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'march'));

  return (new Sequence(120, [], new TimeSignature(8, 4)))
    .addTrack(keys)
    .addTrack(drums);
};

export const timingExercise = () => {
  const keys = defaultKeyTrack
    .setPhrase('keyTick', keyTick())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'keyTick'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'keyTick'));

  const drums = defaultDrumTrack
    .setPhrase('tick', drumTick())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'tick'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'tick'));

  return new Sequence(120, [], new TimeSignature(8, 4))
    .addTrack(keys)
    .addTrack(drums);
};
