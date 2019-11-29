import { assert, instanceOf } from "@/utility/type.js";

import { asFloat, aRational } from "./rational.js";
import BarsBeatsSixteenths from "./BarsBeatsSixteenths.js";
import Beat from "./Beat.js";

/**
 * Represents a length of time beginning on a beat and lasting for a duration
 */
export default class Period {
  constructor(beat, duration) {
    assert(beat, instanceOf(BarsBeatsSixteenths));
    assert(duration, instanceOf(BarsBeatsSixteenths));
    this.beat = beat;
    this.duration = duration;
  }
  static fromBeatDuration(beat, duration) {
    return new Period(beat, BarsBeatsSixteenths.fromTick(duration));
  }
  beginning() {
    return this.beat;
  }
  ending() {
    return this.beat.plus(this.duration);
  }
  beginsOn(beat) {
    return this.beat.equals(beat);
  }
  divide(duration) {
    return this.duration.divide(duration);
  }
  spans(beat) {
    const startsOnOrAfter = beat.after(this.beat) || beat.equals(this.beat);
    const end = this.beat.plus(this.duration);
    const endsStrictlyBefore = beat.before(end);

    return startsOnOrAfter && endsStrictlyBefore;
  }
  equals(period) {
    return this.beat.equals(period.beat) && this.ending().equals(period.ending());
  }
  adjustDurationTo(duration) {
    return new Period(
      this.beat,
      duration
    );
  }
}
