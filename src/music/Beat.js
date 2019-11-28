import { assert, anInteger } from "@/utility/type.js";
import { equals, reduce, sum, toMixed, difference, greaterEqual, aRational, less } from "@/utility/rational.js";

export default class Beat {
  /**
   * @param {Number} beat
   * @param {[Number, Number]} rational
   */
  constructor(beat, rational) {
    assert(beat, anInteger());
    assert(rational, aRational());
    this.beat = beat;
    this.rational = reduce(rational);
  }
  static parse(object) {
    return new Beat(object.beat, object.rational);
  }
  static fromRational(rational) {
    const [beat, remainder] = toMixed(rational);
    return new Beat(beat + 1, remainder);
  }
  get key() {
    return `${this.beat}.${this.rational[0]}.${this.rational[1]}`;
  }
  toRational() {
    return sum([this.beat, 1], this.rational);
  }
  plus(tickSize) {
    let nextBeat = this.beat;
    let nextRational = sum(tickSize, this.rational);
    if (greaterEqual(nextRational, [1, 1])) {
      nextRational = [0, 0];
      nextBeat += 1;
    }

    return new Beat(nextBeat, nextRational);
  }
  minus(beat) {
    return Beat.fromRational(difference(this.toRational(), beat.toRational()));
  }
  modulo(timeSignature) {
    const beat = this.beat > timeSignature.beats ? 1 : this.beat;
    return new Beat(beat, this.rational);
  }
  equals(beat) {
    return this.beat === beat.beat && equals(this.rational, beat.rational);
  }
  before(beat) {
    return less(this.toRational(), beat.toRational());
  }
}
