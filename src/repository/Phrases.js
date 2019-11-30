import { Note } from "@jonathanhunsucker/music-js";

import BarsBeatsSixteenths, { whole, quarter, none } from "@/music/BarsBeatsSixteenths.js";
import Period from "@/music/Period.js";
import Percussion from "@/music/Percussion.js";

import { flatten } from "@/utility/math.js";

import Hit from "@/composition/Hit.js";
import Track from "@/composition/Track.js";
import Phrase from "@/composition/Phrase.js";

/**
 * Factory method for building a list of hits on this beat, for a list of notes.
 *
 * eg. `on(2).hit(['C2']).for(quarter)`
 *
 * @param {Number} beat
 * @param {[Number, Number]} rational
 * @return {hit: f(Note[]) => {for: f([integer, integer]) => Hit[]}}
 */
const on = (beat, rational) => {
  return {
    hit: (pitches) => {
      return {
        for: (duration) => pitches.map((pitch) => new Hit(new Percussion(pitch), new Period(new BarsBeatsSixteenths(0, beat - 1, rational[0] === 0 ? 0 : rational[0] / rational[1] * 16), duration))),
      };
    },
    play: (pitches) => {
      return {
        for: (duration) => pitches.map((pitch) => new Hit(new Note(pitch), new Period(new BarsBeatsSixteenths(0, beat - 1, rational[0] === 0 ? 0 : rational[0] / rational[1] * 16), duration))),
      };
    },
  };
}

export const emptyKeysPhrase = new Phrase(Track.KIND_KEYS, []);
export const emptyDrumsPhrase = new Phrase(Track.KIND_DRUMS, []);

export const cMinorToUpperC = () => {
  return new Phrase('keys', flatten([
    on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for(whole),
    on(3, [2, 4]).play(['C3']).for(quarter),
    on(4, [0, 0]).play(['C3']).for(quarter),
    on(4, [1, 4]).play(['C3']).for(quarter),
    on(4, [1, 2]).play(['C3']).for(quarter),
  ]));
};

export const cMinor = () => {
  return new Phrase('keys', flatten([
    on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for(whole),
  ]));
};

export const keyTick = () => {
  return new Phrase('keys', flatten([
    on(1, [0, 0]).play(['C4']).for(quarter),
    on(2, [0, 0]).play(['C3']).for(quarter),
    on(3, [0, 0]).play(['C3']).for(quarter),
    on(4, [0, 0]).play(['C3']).for(quarter),
  ]));
};

export const march = () => {
  return new Phrase('drums', flatten([
    on(1, [0, 0]).hit(['Kick']).for(none),
    on(1, [0, 0]).hit(['ClosedHat']).for(none),
    on(1, [1, 2]).hit(['ClosedHat']).for(none),
    on(2, [0, 0]).hit(['Kick']).for(none),
    on(2, [0, 0]).hit(['Snare']).for(none),
    on(2, [0, 0]).hit(['ClosedHat']).for(none),
    on(2, [1, 2]).hit(['ClosedHat']).for(none),
    on(3, [0, 0]).hit(['Kick']).for(none),
    on(3, [0, 0]).hit(['ClosedHat']).for(none),
    on(3, [1, 2]).hit(['ClosedHat']).for(none),
    on(4, [0, 0]).hit(['Kick']).for(none),
    on(4, [0, 0]).hit(['Snare']).for(none),
    on(4, [0, 0]).hit(['ClosedHat']).for(none),
    on(4, [1, 2]).hit(['ClosedHat']).for(none),
  ]));
};

export const drumTick = () => {
  return new Phrase('drums', flatten([
    on(1, [0, 0]).hit(['Kick']).for(none),
    on(2, [0, 0]).hit(['Kick']).for(none),
    on(3, [0, 0]).hit(['Kick']).for(none),
    on(4, [0, 0]).hit(['Kick']).for(none),
    on(1, [1, 2]).hit(['Kick']).for(none),
    on(2, [1, 2]).hit(['Kick']).for(none),
    on(3, [1, 2]).hit(['Kick']).for(none),
    on(4, [1, 2]).hit(['Kick']).for(none),
    on(1, [1, 4]).hit(['Kick']).for(none),
    on(2, [1, 4]).hit(['Kick']).for(none),
    on(3, [1, 4]).hit(['Kick']).for(none),
    on(4, [1, 4]).hit(['Kick']).for(none),
    on(1, [3, 4]).hit(['Kick']).for(none),
    on(2, [3, 4]).hit(['Kick']).for(none),
    on(3, [3, 4]).hit(['Kick']).for(none),
    on(4, [3, 4]).hit(['Kick']).for(none),
  ]));
};

