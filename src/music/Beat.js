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
  /**
   * @param [[Number, Number]] tickSize - In beats
   *
   * @return Beat
   */
  plus(tickSize) {
    if (equals(tickSize, [0, 0])) return this;

    let nextBeat = this.beat;
    var remaining = tickSize;
    while (greaterEqual(remaining, [1, 1])) {
      remaining = difference(remaining, [1, 1]);
      nextBeat += 1;
    }

    remaining = sum(remaining, this.rational);
    if (greaterEqual(remaining, [1, 1])) {
      remaining = difference(remaining, [1, 1]);
      nextBeat += 1;
    }

    const result = new Beat(nextBeat, remaining)
    return result;
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
  after(beat) {
    return greater(this.toRational(), beat.toRational());
  }
}
