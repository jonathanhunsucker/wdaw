import { assert, instanceOf, enforce, aNonNegativeInteger } from "@/utility/type.js";

import { toMixed, aRational } from "./rational.js";

const BEATS_IN_BAR = 4;

function numericValue(bbs) {
    return bbs.sixteenths + 16 * (bbs.beats + BEATS_IN_BAR * bbs.bars);
}

export default class BarsBeatsSixteenths {
  constructor(bars, beats, sixteenths) {
    while (sixteenths >= 16) {
      sixteenths -= 16;
      beats += 1;
    }

    while (beats >= BEATS_IN_BAR) {
      beats -= BEATS_IN_BAR;
      bars += 1;
    }

    while (beats < 0) {
      bars -= 1;
      beats += BEATS_IN_BAR;
    }

    while (sixteenths < 0) {
      beats -= 1;
      sixteenths += 16;
    }

    this.bars = bars;
    this.beats = beats;
    this.sixteenths = sixteenths;
    assert(this.bars, aNonNegativeInteger());
    assert(this.beats, aNonNegativeInteger());
    assert(this.sixteenths, aNonNegativeInteger());
  }
  static fromTick(tick) {
    assert(tick, aRational());
    const mixed = toMixed(tick);
    return new BarsBeatsSixteenths(0, mixed[0], mixed[1][0] === 0 ? 0 : mixed[1][0] / mixed[1][1] * 16);
  }
  get key() {
    const bars = this.bars + 1;
    const beats = this.beats + 1;
    const sixteenths = this.sixteenths + 1;
    return `${bars}.${beats}.${sixteenths}`;
  }
  plus(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    const sum = new BarsBeatsSixteenths(this.bars + bbs.bars, this.beats + bbs.beats, this.sixteenths + bbs.sixteenths);
    return sum;
  }
  minus(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    const difference = new BarsBeatsSixteenths(this.bars - bbs.bars, this.beats - bbs.beats, this.sixteenths - bbs.sixteenths);;
    return difference;
  }
  divide(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return numericValue(this) / numericValue(bbs);
  }
  after(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return numericValue(this) > numericValue(bbs);
  }
  before(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return numericValue(this) < numericValue(bbs);
  }
  equals(bbs) {
    assert(bbs, instanceOf(BarsBeatsSixteenths));
    return numericValue(this) === numericValue(bbs);
  }
  isRound() {
    return this.sixteenths % 16 === 0;
  }
}
