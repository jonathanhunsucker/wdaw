import { asFloat } from "./rational.js";
import BarsBeatsSixteenths from "./BarsBeatsSixteenths.js";

/**
 * Represents a length of time beginning on a beat and lasting for a duration
 */
export default class Period {
  constructor(beat, duration) {
    this.beat = beat;
    this.duration = duration;
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
    return asFloat(this.duration) / asFloat(duration);
  }
  durationInFloatingBeats() {
    return asFloat(this.duration);
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
}
