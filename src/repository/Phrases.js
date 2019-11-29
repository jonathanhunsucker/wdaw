import { Note } from "@jonathanhunsucker/music-js";

import Beat from "@/music/Beat.js";
import Period from "@/music/Period.js";
import Percussion from "@/music/Percussion.js";

import { flatten } from "@/utility/math.js";

import Hit from "@/composition/Hit.js";
import Phrase from "@/composition/Phrase.js";
/**
 * Factory method for building a list of hits on this beat, for a list of notes.
 *
 * eg. `on(2).hit(['C2']).for([1, 4])`
 *
 * @param {Number} beat
 * @param {[Number, Number]} rational
 * @return {hit: f(Note[]) => {for: f([integer, integer]) => Hit[]}}
 */
const on = (beat, rational) => {
  return {
    hit: (pitches) => {
      return {
        for: (duration) => pitches.map((pitch) => new Hit(new Percussion(pitch), Period.fromBeatDuration((new Beat(beat, rational)).toBbs(), duration))),
      };
    },
    play: (pitches) => {
      return {
        for: (duration) => pitches.map((pitch) => new Hit(new Note(pitch), Period.fromBeatDuration((new Beat(beat, rational)).toBbs(), duration))),
      };
    },
  };
}

export const cMinorToUpperC = () => {
  return new Phrase('keys', flatten([
    on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for([1, 1]),
    on(3, [2, 4]).play(['C3']).for([1, 4]),
    on(4, [0, 0]).play(['C3']).for([1, 4]),
    on(4, [1, 4]).play(['C3']).for([1, 4]),
    on(4, [1, 2]).play(['C3']).for([1, 4]),
  ]));
};

export const cMinor = () => {
  return new Phrase('keys', flatten([
    on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for([1, 1]),
  ]));
};

export const keyTick = () => {
  return new Phrase('keys', flatten([
    on(1, [0, 0]).play(['C4']).for([1, 4]),
    on(2, [0, 0]).play(['C3']).for([1, 4]),
    on(3, [0, 0]).play(['C3']).for([1, 4]),
    on(4, [0, 0]).play(['C3']).for([1, 4]),
  ]));
};

export const march = () => {
  return new Phrase('drums', flatten([
    on(1, [0, 0]).hit(['Kick']).for([0, 0]),
    on(1, [0, 0]).hit(['ClosedHat']).for([0, 0]),
    on(1, [1, 2]).hit(['ClosedHat']).for([0, 0]),
    on(2, [0, 0]).hit(['Kick']).for([0, 0]),
    on(2, [0, 0]).hit(['Snare']).for([0, 0]),
    on(2, [0, 0]).hit(['ClosedHat']).for([0, 0]),
    on(2, [1, 2]).hit(['ClosedHat']).for([0, 0]),
    on(3, [0, 0]).hit(['Kick']).for([0, 0]),
    on(3, [0, 0]).hit(['ClosedHat']).for([0, 0]),
    on(3, [1, 2]).hit(['ClosedHat']).for([0, 0]),
    on(4, [0, 0]).hit(['Kick']).for([0, 0]),
    on(4, [0, 0]).hit(['Snare']).for([0, 0]),
    on(4, [0, 0]).hit(['ClosedHat']).for([0, 0]),
    on(4, [1, 2]).hit(['ClosedHat']).for([0, 0]),
  ]));
};

export const drumTick = () => {
  return new Phrase('drums', flatten([
    on(1, [0, 0]).hit(['Kick']).for([0, 0]),
    on(2, [0, 0]).hit(['Kick']).for([0, 0]),
    on(3, [0, 0]).hit(['Kick']).for([0, 0]),
    on(4, [0, 0]).hit(['Kick']).for([0, 0]),
    on(1, [1, 2]).hit(['Kick']).for([0, 0]),
    on(2, [1, 2]).hit(['Kick']).for([0, 0]),
    on(3, [1, 2]).hit(['Kick']).for([0, 0]),
    on(4, [1, 2]).hit(['Kick']).for([0, 0]),
    on(1, [1, 4]).hit(['Kick']).for([0, 0]),
    on(2, [1, 4]).hit(['Kick']).for([0, 0]),
    on(3, [1, 4]).hit(['Kick']).for([0, 0]),
    on(4, [1, 4]).hit(['Kick']).for([0, 0]),
    on(1, [3, 4]).hit(['Kick']).for([0, 0]),
    on(2, [3, 4]).hit(['Kick']).for([0, 0]),
    on(3, [3, 4]).hit(['Kick']).for([0, 0]),
    on(4, [3, 4]).hit(['Kick']).for([0, 0]),
  ]));
};

