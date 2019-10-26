class Note {
  constructor(pitch) {
    this.pitch = pitch;
  }
  static parse(object) {
    return new Note(object.pitch);
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
  hasHitOnBeat(beat) {
    return this.hits.filter((hit) => hit.beat === beat).length > 0;
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
  constructor(tracks, numberOfBeats) {
    this.tracks = tracks;
    this.numberOfBeats = numberOfBeats;
  }
  static fromNothing() {
    return new Sequencer(
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
      object.tracks.map((trackObject) => Track.parse(trackObject)),
      object.numberOfBeats
    );
  }
  get beats() {
    return [...Array(this.numberOfBeats).keys()].map((i) => ++i);
  }
  toggleHit(givenTrack, beat) {
    return new Sequencer(
      this.tracks.map((track) => {
        return track === givenTrack ? track.toggle(beat) : track;
      }),
      this.numberOfBeats
    );
  }
};
