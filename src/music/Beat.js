import { assert, anInteger } from "./../types.js";

import { rationalEquals, reduceRational, rationalSum, rationalToMixed, rationalDifference, rationalGreaterEqual, aRational, rationalLess } from "./../math.js";

export default class Beat {
  /**
   * @param {Number} beat
   * @param {[Number, Number]} rational
   */
  constructor(beat, rational) {
    assert(beat, anInteger());
    assert(rational, aRational());
    this.beat = beat;
    this.rational = reduceRational(rational);
  }
  static parse(object) {
    return new Beat(object.beat, object.rational);
  }
  static fromRational(rational) {
    const [beat, remainder] = rationalToMixed(rational);
    return new Beat(beat + 1, remainder);
  }
  get key() {
    return `${this.beat}.${this.rational[0]}.${this.rational[1]}`;
  }
  toRational() {
    return rationalSum([this.beat, 1], this.rational);
  }
  plus(tickSize) {
    let nextBeat = this.beat;
    let nextRational = rationalSum(tickSize, this.rational);
    if (rationalGreaterEqual(nextRational, [1, 1])) {
      nextRational = [0, 0];
      nextBeat += 1;
    }

    return new Beat(nextBeat, nextRational);
  }
  minus(beat) {
    return Beat.fromRational(rationalDifference(this.toRational(), beat.toRational()));
  }
  modulo(timeSignature) {
    const beat = this.beat > timeSignature.beats ? 1 : this.beat;
    return new Beat(beat, this.rational);
  }
  equals(beat) {
    return this.beat === beat.beat && rationalEquals(this.rational, beat.rational);
  }
  before(beat) {
    return rationalLess(this.toRational(), beat.toRational());
  }
}
