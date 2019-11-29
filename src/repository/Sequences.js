import BarsBeatsSixteenths from "@/music/BarsBeatsSixteenths.js";
import TimeSignature from "@/music/TimeSignature.js";

import Placement from "@/composition/Placement.js";
import Track from "@/composition/Track.js";
import Sequence from "@/composition/Sequence.js";

import { synth, hat, snare } from "./Patches.js";
import { cMinorToUpperC, cMinor, keyTick, drumTick, march } from "./Phrases.js";

export const basic = () => {
  const keys = new Track('Track 1', 'keys', {}, [], [])
    .setPatch('*', synth())
    .setPhrase('cMinorToUpperC', cMinorToUpperC())
    .setPhrase('cMinor', cMinor())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'cMinorToUpperC'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'cMinor'));

  const drums = new Track('Track 2', 'drums', {}, [], [])
    .setPatch('ClosedHat', hat())
    .setPatch('Kick', hat())
    .setPatch('Snare', snare())
    .setPhrase('march', march())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'march'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'march'));

  return (new Sequence(120, [], new TimeSignature(8, 4)))
    .addTrack(keys)
    .addTrack(drums);
};

export const timingExercise = () => {
  const keys = new Track('Track 1', 'keys', {}, [], [])
    .setPatch('*', synth())
    .setPhrase('keyTick', keyTick())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'keyTick'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'keyTick'));

  const drums = new Track('Track 2', 'drums', {}, [], [])
    .setPatch('ClosedHat', hat())
    .setPatch('Kick', hat())
    .setPatch('Snare', snare())
    .setPhrase('tick', drumTick())
    .addPlacement(new Placement(new BarsBeatsSixteenths(0, 0, 0), 'tick'))
    .addPlacement(new Placement(new BarsBeatsSixteenths(1, 0, 0), 'tick'));

  return new Sequence(120, [], new TimeSignature(8, 4))
    .addTrack(keys)
    .addTrack(drums);
};
