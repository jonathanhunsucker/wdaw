import { assert, instanceOf, anInteger } from "@/utility/type.js";
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
    return this.toBbs().key;
  }
  isRound() {
    return this.toBbs().isRound();
  }
  /**
   * @param [[Number, Number]] tickSize - In beats
   *
   * @return Beat
   */
  plus(tickSize) {
    assert(tickSize, instanceOf(BarsBeatsSixteenths));
    return this.toBbs().plus(tickSize);
  }
  minus(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return this.toBbs().minus(bbs);
  }
  equals(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return this.toBbs().equals(bbs);
  }
  before(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return this.toBbs().before(bbs);
  }
  after(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return this.toBbs().after(bbs);
  }
}
