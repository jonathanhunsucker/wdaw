export default class Note {
  /**
   * @param {string} pitch - In scientific pitch notation, eg. C2, Eb6, F#-1
   */
  constructor(pitch) {
    const scientificPitchNotationExpression = /^([A-G])([#b]?)(-?\d+)$/
    const parts = pitch.match(scientificPitchNotationExpression);
    if (parts instanceof Array === false) {
      throw new Error(pitch + ' is unparseable');
    }

    this.parts = parts;
    this.pitch = pitch;
  }
  static parse(object) {
    return new Note(object.pitch);
  }
  get frequency() {
    const middleAFrequency = 440.0;
    const relativeStepMultiplier = Math.pow(2, 1/12);

    const frequency = middleAFrequency * Math.pow(relativeStepMultiplier, this.stepsFromMiddleA);
    return frequency;
  }
  get octave() {
    const [wholeThing, note, accidental, octave] = this.parts;
    return parseInt(octave, 10);
  }
  get step() {
    const [wholeThing, note, accidental, octave] = this.parts;
    const integerNote = ['A', '_', 'B', 'C', '_', 'D', '_', 'E', 'F', '_', 'G', '_'].indexOf(note);
    const accidentalVariation = {'b': -1, '#': 1, '': 0}[accidental];

    return integerNote + accidentalVariation;
  }
  get stepsFromMiddleA() {
    return 12 * (this.octave - 3) + this.step;
  }
  equals(note) {
    return this.pitch === note.pitch;
  }
  /**
   * Override toJSON to encapsulate private members like, this.parts
   */
  toJSON() {
    return {
      pitch: this.pitch,
    };
  }
}
