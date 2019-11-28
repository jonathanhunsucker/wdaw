import { asFloat } from "@/utility/rational.js";

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
  beginning() {
    return this.beat;
  }
  endingAsRational() {
    return this.ending().toRational();
  }
  ending() {
    return this.beat.plus(this.duration);
  }
  beginsOn(beat) {
    return this.beat.equals(beat);
  }
  divide(duration) {
    return asFloat(this.duration) / asFloat(duration);
  }
  durationInFloatingBeats() {
    return asFloat(this.duration);
  }
  spans(beat) {
    const startsOnOrAfter = beat.after(this.beat) || beat.equals(this.beat);
    const endsStrictlyBefore = beat.before(this.beat.plus(this.duration));

    return startsOnOrAfter && endsStrictlyBefore;
  }
  equals(period) {
    return this.beat.equals(period.beat) && this.ending().equals(period.ending());
  }
}
