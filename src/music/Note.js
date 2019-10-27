export default class Note {
  /**
   * @param {string} pitch - In scientific pitch notation, eg. C2, Eb6, F#-1
   */
  constructor(pitch) {
    const scientificPitchNotationExpression = /^([A-G])([#b]?)(-?\d+)$/
    const parts = pitch.match(scientificPitchNotationExpression);
    if (parts instanceof Array === false) {
      throw new Error(this.pitch + ' is unparseable');
    }

    this.parts = parts;
    this.pitch = pitch;
  }
  static parse(object) {
    return new Note(object.pitch);
  }
  get frequency() {
    const middleCFrequency = 440.0;
    const relativeStepMultiplier = Math.pow(2, 1/12);

    const [wholeThing, note, accidental, octave] = this.parts;
    const integerNote = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(note);
    const accidentalVariation = {'b': -1, '#': 1, '': 0}[accidental];
    const integerOctave = parseInt(octave, 10);

    const stepsFromMiddleC = 12 * (integerOctave - 4) + integerNote + accidentalVariation;
    const frequency = middleCFrequency * Math.pow(relativeStepMultiplier, stepsFromMiddleC);

    return frequency;
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
