import Period from "@/music/Period.js";

export default class Hit {
  /**
   * @param {Note} note
   * @param {Beat} beat
   * @param {[integer, integer]} duration
   */
  constructor(note, beat, duration) {
    this.note = note;
    this.beat = beat;
    this.duration = duration;
    this.period = new Period(this.beat, this.duration);
  }
  equals(hit) {
    return this.note.equals(hit.note) && this.period.equals(hit.period);
  }
  adjustDurationToBeat(beat) {
    return new Hit(
      this.note,
      this.beat,
      beat.toRational()
    );
  }
}
