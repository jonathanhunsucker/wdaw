import { Binding, stageFactory, Gain, Envelope, Wave } from "./audio/Nodes.js";
import { Note } from "@jonathanhunsucker/music-js";
import Beat from "./music/Beat.js";
import TimeSignature from "./music/TimeSignature.js";
import { range, flatten } from "./math.js";

class Expiration {
  /**
   * @param {Binding} binding
   */
  constructor(binding) {
    this.binding = binding;
    this.timer = 10;
  }
  isExpired() {
    this.timer--;
    return this.timer < 0;
  }
  expire() {
    this.binding.stop();
  }
}

export class Hit {
  /**
   * @param {Note} note
   * @param {Beat} beat
   */
  constructor(note, beat) {
    this.note = note;
    this.beat = beat;
  }
  static parse(object) {
    const parsed = new Hit(
      Note.parse(object.note),
      Beat.parse(object.beat)
    );
    return parsed;
  }
  equals(hit) {
    return this.note.equals(hit.note) && this.beat.equals(hit.beat);
  }
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
    return this.hits.filter((hit) => hit.beat.equals(beat));
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
  constructor(tempo, tracks, timeSignature) {
    this.tempo = tempo;
    this.tracks = tracks;
    this.timeSignature = new TimeSignature(4, 4);
    this.divisions = 4;
  }
  static fromNothing() {
    /**
     * Factory method for building a list of hits on this beat, for a list of notes.
     *
     * eg. `on(2).hit(['C2'])`
     *
     * @param {Number} beat
     * @param {[Number, Number]} rational
     * @return {hit: f(Note[]) => Hit[]}
     */
    const on = (beat, rational) => {
      return {
        hit: (pitches) => pitches.map((pitch) => new Hit(new Note(pitch), new Beat(beat, rational))),
      };
    }

    return new Sequencer(
      120,
      [
        new Track(
          "Track 1",
          new Envelope(
            {},
            [new Wave('triangle')]
          ),
          flatten([
            on(1, [0, 0]).hit(['C2']),
            on(2, [0, 0]).hit(['E2']),
            on(3, [0, 0]).hit(['G2']),
            on(3, [1, 2]).hit(['C3']),
            on(4, [0, 0]).hit(['C3']),
          ])
        ),
      ],
      new TimeSignature(4, 4)
    );
  }
  static parse(object) {
    return new Sequencer(
      object.tempo,
      object.tracks.map((trackObject) => Track.parse(trackObject)),
      object.timeSignature
    );
  }
  get beats() {
    return flatten(
      range(1, this.timeSignature.beats).map((beat) => {
        return range(0, this.divisions - 1).map((numerator) => new Beat(beat, [numerator, this.divisions]));
      })
    );
  }
  toggleHit(givenTrack, hit) {
    return new Sequencer(
      this.tempo,
      this.tracks.map((track) => {
        return track === givenTrack ? track.toggle(hit) : track;
      }),
      this.timeSignature
    );
  }
  /**
   * @param {AudioContext} audioContext
   * @param {Beat} beat
   *
   * @returns {Expiration[]}
   */
  play(audioContext, beat) {
    const expirations = flatten(
      this.tracks.map((track) => {
        return track.hitsOnBeat(beat).map((hit) => {
          return new Expiration(track.voice.bind(hit.note));
        });
      })
    );

    const binding = new Binding(
      new Gain(0.1),
      null,
      expirations.map((expiration) => expiration.binding)
    );

    binding.play(audioContext, audioContext.destination);

    return expirations;
  }
  setTempo(newTempo) {
    return new Sequencer(
      newTempo,
      this.tracks,
      this.timeSignature
    );
  }
};
