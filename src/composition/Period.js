import { equals, sum, greaterEqual, less } from "@/utility/rational.js";

/**
 * Represents a length of time beginning on a beat and lasting for a duration
 */
export default class Period {
  constructor(beat, duration) {
    this.beat = beat;
    this.duration = duration;
  }
  beginningAsRational() {
    return this.beat.toRational();
  }
  endingAsRational() {
    return sum(this.beginningAsRational(), this.duration);
  }
  beginsOn(beat) {
    return this.beat.equals(beat);
  }
  spans(beat) {
    const startsOnOrAfter = greaterEqual(beat.toRational(), this.beginningAsRational());
    const endsStrictlyBefore = less(beat.toRational(), this.endingAsRational());

    return startsOnOrAfter && endsStrictlyBefore;
  }
  equals(period) {
    return this.beat.equals(period.beat) && equals(this.duration, period.duration);
  }
}
