import { Note } from "@jonathanhunsucker/music-js";

import BarsBeatsSixteenths from "@/music/BarsBeatsSixteenths.js";

import { assert, instanceOf } from "@/utility/type.js";
import { range, flatten } from "@/utility/math.js";
import { repackArray } from "@/utility/functional.js";

import Track from "./Track.js";
import Phrase from "./Phrase.js";

export default class Sequence {
  constructor(tempo, tracks, timeSignature) {
    this.tempo = tempo;
    this.tracks = tracks;
    this.timeSignature = timeSignature;
    this.divisions = 4;
    this.tickSize = new BarsBeatsSixteenths(0, 0, 4);
  }
  static parse(object) {
    return new Sequence(
      object.tempo,
      object.tracks.map((trackObject) => Track.parse(trackObject)),
      object.timeSignature
    );
  }
  get beats() {
    return flatten(
      range(1, this.timeSignature.beats).map((beat) => {
        return range(0, this.divisions - 1).map((numerator) => new BarsBeatsSixteenths(0, beat - 1, numerator * 4));
      })
    );
  }
  toggleHit(givenTrack, hit) {
    return this.replaceTrack(givenTrack, givenTrack.toggle(hit));
  }
  addTrack(addition) {
    assert(addition, instanceOf(Track));

    return new Sequence(
      this.tempo,
      this.tracks.concat([addition]),
      this.timeSignature
    );
  }
  replaceTrack(before, after) {
    return new Sequence(
      this.tempo,
      repackArray(this.tracks).replaceItem(before, after),
      this.timeSignature
    );
  }
  secondsPerBeat() {
    const minutesPerBeat = 1 / this.tempo;
    const secondsPerBeat = minutesPerBeat * 60;
    return secondsPerBeat;
  }
  setTempo(newTempo) {
    return new Sequence(
      newTempo,
      this.tracks,
      this.timeSignature
    );
  }
};
