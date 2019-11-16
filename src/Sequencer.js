import { Binding, stageFactory, Gain, Envelope, Wave } from "@jonathanhunsucker/audio-js";
import { Note } from "@jonathanhunsucker/music-js";
import Beat from "./music/Beat.js";
import TimeSignature from "./music/TimeSignature.js";
import { range, flatten, rationalEquals, rationalSum, rationalGreaterEqual, rationalLess, rationalDifference, rationalAsFloat } from "./math.js";

class Expiration {
  /**
   * @param {Binding} binding
   */
  constructor(binding) {
    this.binding = binding;
    this.timer = 10;// todo replace with beat-based expiration, in way that's compatible with multiple measures
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
   * @param {[integer, integer]} duration
   */
  constructor(note, beat, duration) {
    this.note = note;
    this.beat = beat;
    this.duration = duration;
  }
  static parse(object) {
    const parsed = new Hit(
      Note.parse(object.note),
      Beat.parse(object.beat),
      object.duration,
    );
    return parsed;
  }
  beginningAsRational() {
    return this.beat.toRational();
  }
  endingAsRational() {
    return rationalSum(this.beginningAsRational(), this.duration);
  }
  spans(beat) {
    const startsOnOrAfter = rationalGreaterEqual(beat.toRational(), this.beginningAsRational());
    const endsStrictlyBefore = rationalLess(beat.toRational(), this.endingAsRational());

    return startsOnOrAfter && endsStrictlyBefore;
  }
  beginsOn(beat) {
    return this.beat.equals(beat);
  }
  endsOn(beat) {
    return rationalEquals(this.endingAsRational(), beat.toRational());
  }
  equals(hit) {
    return this.note.equals(hit.note) && this.beat.equals(hit.beat) && rationalEquals(this.duration, hit.duration);
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
  without(toRemove) {
    return new Track(
      this.name,
      this.voice,
      this.hits.filter((hit) => hit !== toRemove)
    );
  }
  setVoice(voice) {
    return new Track(
      this.name,
      voice,
      this.hits
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
  static fromNothing(patch) {
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
          patch,
          flatten([
            on(2, [0, 0]).hit(['C2']),
            on(2, [0, 0]).hit(['D#2']),
            on(2, [0, 0]).hit(['G2']),
            on(3, [2, 4]).hit(['C3']),
            on(4, [0, 0]).hit(['C3']),
            on(4, [1, 4]).hit(['C3']),
            on(4, [1, 2]).hit(['C3']),
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
    return this.replaceTrack(givenTrack, givenTrack.toggle(hit));
  }
  replaceTrack(before, after) {
    return new Sequencer(
      this.tempo,
      this.tracks.map((track) => track === before ? after : track),
      this.timeSignature
    );
  }
  /**
   * @param {AudioContext} audioContext
   * @param {AudioNode} destination
   * @param {Beat} beat
   *
   * @returns {Expiration[]}
   */
  play(audioContext, destination, beat) {
    const expirations = flatten(
      this.tracks.map((track) => {
        return track.hitsOnBeat(beat).map((hit) => {
          return new Expiration(track.voice.bind(hit.note.frequency));
        });
      })
    );

    const binding = new Binding(
      new Gain(1.0),
      null,
      expirations.map((expiration) => expiration.binding)
    );

    binding.play(audioContext, destination);

    return expirations;
  }
  setTempo(newTempo) {
    return new Sequencer(
      newTempo,
      this.tracks,
      this.timeSignature
    );
  }
  setTrack(index, track) {
    const tracks = this.tracks.slice();
    tracks[index] = track;

    return new Sequencer(
      this.tempo,
      tracks,
      this.timeSignature
    );
  }
};
