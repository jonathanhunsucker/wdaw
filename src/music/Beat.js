import { rationalEquals, reduceRational, rationalSum, rationalGreaterEqual } from "./../math.js";

export default class Beat {
  /**
   * @param {Number} beat
   * @param {[Number, Number]} rational
   */
  constructor(beat, rational) {
    this.beat = beat;
    this.rational = reduceRational(rational);
  }
  static parse(object) {
    return new Beat(object.beat, object.rational);
  }
  get key() {
    return `${this.beat}.${this.rational[0]}.${this.rational[1]}`;
  }
  toRational() {
    return rationalSum([this.beat, 1], this.rational);
  }
  plus(tickSize, timeSignature) {
    let nextBeat = this.beat;
    let nextRational = rationalSum(tickSize, this.rational);
    if (rationalGreaterEqual(nextRational, [1, 1])) {
      nextRational = [0, 0];
      nextBeat += 1;
    }

    if (nextBeat > timeSignature.beats) {
      nextBeat = 1;
    }

    return new Beat(nextBeat, nextRational);
  }
  equals(beat) {
    return this.beat === beat.beat && rationalEquals(this.rational, beat.rational);
  }
}
