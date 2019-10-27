import { ping } from "./audio/Nodes.js";

class Note {
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

class Beat {
  constructor(beat) {
    this.beat = beat;
  }
  static parse(object) {
    return new Beat(object);
  }
  hit(notes) {
    return notes.map((note) => new Hit(note, this.beat));
  }
}

function on(beat) {
  return new Beat(beat);
}

class Hit {
  constructor(note, beat) {
    this.note = note;
    this.beat = beat;
  }
  static parse(object) {
    const parsed = new Hit(
      Note.parse(object.note),
      object.beat
    );
    return parsed;
  }
  get frequency() {
    return this.note.frequency;
  }
}

const C2 = new Note('C2');
const E2 = new Note('E2');
const G2 = new Note('G2');
const C3 = new Note('C3');

function flatten(lists) {
  return [].concat.apply([], lists);
}

class Track {
  constructor(name, hits) {
    this.name = name;
    this.hits = hits;
  }
  static parse(object) {
    return new Track(
      object.name,
      object.hits.map((hit) => Hit.parse(hit))
    );
  }
  hitsOnBeat(beat) {
    return this.hits.filter((hit) => hit.beat === beat);
  }
  hasHitOnBeat(beat) {
    return this.hitsOnBeat(beat).length > 0;
  }
  toggle(beat) {
    return this.hasHitOnBeat(beat) ? this.remove(beat) : this.add(beat);
  }
  add(beat) {
    return new Track(
      this.name,
      this.hits.concat(on(beat).hit([C2]))
    );
  }
  remove(beat) {
    return new Track(
      this.name,
      this.hits.filter((hit) => hit.beat !== beat)
    );
  }
}

export default class Sequencer {
  constructor(tempo, tracks, numberOfBeats) {
    this.tempo = tempo;
    this.tracks = tracks;
    this.numberOfBeats = numberOfBeats;
  }
  static fromNothing() {
    return new Sequencer(
      120,
      [
        new Track("Track 1", flatten([
          on(1).hit([C2]),
          on(2).hit([E2]),
          on(3).hit([G2]),
          on(4).hit([C3]),
        ])),
      ],
      4
    );
  }
  static parse(object) {
    return new Sequencer(
      object.tempo,
      object.tracks.map((trackObject) => Track.parse(trackObject)),
      object.numberOfBeats
    );
  }
  get beats() {
    return [...Array(this.numberOfBeats).keys()].map((i) => ++i);
  }
  toggleHit(givenTrack, beat) {
    return new Sequencer(
      this.tempo,
      this.tracks.map((track) => {
        return track === givenTrack ? track.toggle(beat) : track;
      }),
      this.numberOfBeats
    );
  }
  play(audioContext, beat) {
    this.tracks.forEach((track) => {
      const hits = track.hitsOnBeat(beat);
      hits.forEach((hit) => {
        ping(audioContext, hit.frequency, 1.0);
      });
    });
  }
  setTempo(newTempo) {
    return new Sequencer(
      newTempo,
      this.tracks,
      this.numberOfBeats
    );
  }
};
