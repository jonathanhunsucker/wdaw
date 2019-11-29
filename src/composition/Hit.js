import Period from "@/music/Period.js";

export default class Hit {
  /**
   * @param {Note} note
   * @param {Period} period
   */
  constructor(note, period) {
    this.note = note;
    this.period = period;
  }
  equals(hit) {
    return this.note.equals(hit.note) && this.period.equals(hit.period);
  }
  adjustDurationTo(duration) {
    return new Hit(
      this.note,
      this.period.adjustDurationTo(duration)
    );
  }
}
