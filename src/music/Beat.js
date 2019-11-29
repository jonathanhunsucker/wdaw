import { assert, anInteger } from "@/utility/type.js";
import { equals, reduce, sum, toMixed, difference, greater, greaterEqual, aRational, less } from "./rational.js";

import BarsBeatsSixteenths from "./BarsBeatsSixteenths.js";

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
  static fromRational(rational) {
    const [beat, remainder] = toMixed(rational);
    return new Beat(beat + 1, remainder);
  }
  toBbs() {
    var bars = 0;
    var beats = this.beat - 1;
    var sixteenths = this.rational[0] === 0 ? 0 : (this.rational[0] / this.rational[1] * 16);
    return new BarsBeatsSixteenths(bars, beats, sixteenths);
  }
  static fromBbs(bbs) {
    const beat = bbs.beats + 1 + 4 * bbs.bars;
    const rational = reduce([bbs.sixteenths / 4, 4]);
    return new Beat(beat, rational);
  }
  get key() {
    const bars = this.toBbs().bars + 1;
    const beats = this.toBbs().beats + 1;
    const sixteenths = this.toBbs().sixteenths + 1;
    return `${bars}.${beats}.${sixteenths}`;
  }
  isRound() {
    return this.toBbs().isRound();
  }
  toRational() {
    return sum([this.beat- 1, 1], this.rational);
  }
  /**
   * @param [[Number, Number]] tickSize - In beats
   *
   * @return Beat
   */
  plus(tickSize) {
    const tickSizeBbs = new BarsBeatsSixteenths(0, 0, tickSize[0] === 0 ? 0 : tickSize[0] / tickSize[1] * 16);
    return Beat.fromBbs(this.toBbs().plus(tickSizeBbs));
  }
  minus(beat) {
    return Beat.fromBbs(this.toBbs().minus(beat.toBbs()));
  }
  equals(beat) {
    return this.toBbs().equals(beat.toBbs());
  }
  before(beat) {
    return this.toBbs().before(beat.toBbs());
  }
  after(beat) {
    return this.toBbs().after(beat.toBbs());
  }
}
