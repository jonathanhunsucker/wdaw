import { Binding, stageFactory, Gain } from "./audio/Nodes.js";
import Note from "./music/Note.js";
import { range } from "./math.js";

class Beat {
  constructor(beat) {
    this.beat = beat;
  }
  static parse(object) {
    return new Beat(object);
  }
  /**
   * Factory method for building a list of hits on this beat, for a list of notes.
   *
   * eg. `(new Beat(2)).hit([new Note('C2')])`
   *
   * @param {Note[]} notes
   * @return {Hit[]}
   */
  hit(notes) {
    return notes.map((note) => new Hit(note, this.beat));
  }
}

/**
 * Factory method sugar for Beat constructor.
 *
 * eg. `on(2)`
 *
 * @param {Number} beat
 * @return {Beat}
 */
function on(beat) {
  return new Beat(beat);
}

export class Hit {
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
  equals(hit) {
    return this.note.equals(hit.note) && this.beat === hit.beat;
  }
}

function flatten(lists) {
  return [].concat.apply([], lists);
}

class Track {
  constructor(name, voice, hits) {
    this.name = name;
    this.voice = voice;
    this.hits = hits;
  }
  static parse(object) {
    return new Track(
      object.name || 'Untitled track',
      stageFactory(object.voice),
      object.hits.map((hit) => Hit.parse(hit))
    );
  }
  hitsOnBeat(beat) {
    return this.hits.filter((hit) => hit.beat === beat);
  }
  hasHit(subject) {
    return this.hits.filter((hit) => subject.equals(hit)).length > 0;
  }
  toggle(hit) {
    return this.hasHit(hit) ? this.remove(hit) : this.add(hit);
  }
  add(hit) {
    return new Track(
      this.name,
      this.voice,
      this.hits.concat(hit)
    );
  }
  remove(subject) {
    return new Track(
      this.name,
      this.voice,
      this.hits.filter((hit) => subject.equals(hit) === false)
    );
  }
}

export class Sequencer {
  constructor(tempo, tracks, numberOfBeats) {
    this.tempo = tempo;
    this.tracks = tracks;
    this.numberOfBeats = numberOfBeats;
  }
  static fromNothing() {
    const C2 = new Note('C2');
    const E2 = new Note('E2');
    const G2 = new Note('G2');
    const C3 = new Note('C3');

    return new Sequencer(
      120,
      [
        new Track(
          "Track 1",
          null,
          flatten([
            on(1).hit([C2]),
            on(2).hit([E2]),
            on(3).hit([G2]),
            on(4).hit([C3]),
          ])
        ),
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
    return range(1, this.numberOfBeats);
  }
  toggleHit(givenTrack, hit) {
    return new Sequencer(
      this.tempo,
      this.tracks.map((track) => {
        return track === givenTrack ? track.toggle(hit) : track;
      }),
      this.numberOfBeats
    );
  }
  play(audioContext, beat) {
    const binding = new Binding(
      new Gain(0.1),
      null,
      flatten(this.tracks.map((track) => track.hitsOnBeat(beat).map((hit) => new Binding(track.voice, hit.note, []))))
    );

    binding.play(audioContext, audioContext.destination);
  }
  setTempo(newTempo) {
    return new Sequencer(
      newTempo,
      this.tracks,
      this.numberOfBeats
    );
  }
};
