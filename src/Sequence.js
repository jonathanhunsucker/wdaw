import { Binding, stageFactory, Gain, Envelope, Wave, Filter, Noise } from "@jonathanhunsucker/audio-js";
import { Note } from "@jonathanhunsucker/music-js";
import Beat from "./music/Beat.js";
import TimeSignature from "./music/TimeSignature.js";
import { range, flatten, rationalEquals, rationalSum, rationalGreaterEqual, rationalLess, rationalDifference, rationalAsFloat } from "./math.js";

// will walk and talk like a note, but for representing percusive notes instead of scientific pitch notation
// eventually, should be rolled back into music-js
class Percussion {
  constructor(pitch) {
    this.pitch = pitch;
  }
  equals(percussion) {
    return this.pitch === percussion.pitch;
  }
}

// front for Percussion or Note
class UniversalNoteParser {
  constructor() {
    throw new Error('Abstract class');
  }
  static parse(object) {
    try {
      return new Note(object);
    } catch (e) {
      return new Percussion(object);
    }
  }
}

const unique = (item, index, list) => {
  return list.indexOf(item) === index;
};

const memo = (that, property, getter) => {
  if (that.hasOwnProperty(property) === false) {
    that[property] = getter();
  }

  return that[property];
}

class Expiration {
  /**
   * @param {Binding} binding
   * @param {float} expiresOn
   */
  constructor(binding, expiresOn) {
    this.binding = binding;
    this.expiresOn = expiresOn;
  }
  expiresBy(moment) {
    return moment > this.expiresOn;
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
  adjustDurationTo(duration) {
    return new Hit(
      this.note,
      this.beat,
      duration
    );
  }
}

class Track {
  constructor(name, voice, hits, notes) {
    this.name = name;
    this.voice = voice;
    this.hits = hits;
    this.notes = notes;
  }
  static parse(object) {
    return new Track(
      object.name || 'Untitled track',
      stageFactory(object.voice),
      object.hits.map((hit) => Hit.parse(hit)),
      object.notes.map((note) => UniversalNoteParser.parse(note))
    );
  }
  findHits(filters) {
    return this.hits.filter((hit) => {
      if (filters.hasOwnProperty('note') && !hit.note.equals(filters.note)) return false;
      if (filters.hasOwnProperty('spans') && !hit.spans(filters.spans)) return false;
      if (filters.hasOwnProperty('beginningOn') && !hit.beginsOn(filters.beginningOn)) return false;

      return true;
    });
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
      this.hits.concat(hit),
      this.notes
    );
  }
  remove(subject) {
    return new Track(
      this.name,
      this.voice,
      this.hits.filter((hit) => subject.equals(hit) === false),
      this.notes
    );
  }
  without(toRemove) {
    return new Track(
      this.name,
      this.voice,
      this.hits.filter((hit) => hit !== toRemove),
      this.notes
    );
  }
  setVoice(voice) {
    return new Track(
      this.name,
      voice,
      this.hits,
      this.notes
    );
  }
}

export class Sequence {
  constructor(tempo, tracks, timeSignature) {
    this.tempo = tempo;
    this.tracks = tracks;
    this.timeSignature = new TimeSignature(4, 4);
    this.divisions = 4;
    this.tickSize = [1, 4];
  }
  static fromNothing(patch) {
    const notes = (pitches) => {
      return pitches.map((pitch) => UniversalNoteParser.parse(pitch));
    };

    /**
     * Factory method for building a list of hits on this beat, for a list of notes.
     *
     * eg. `on(2).hit(['C2']).for([1, 4])`
     *
     * @param {Number} beat
     * @param {[Number, Number]} rational
     * @return {hit: f(Note[]) => {for: f([integer, integer]) => Hit[]}}
     */
    const on = (beat, rational) => {
      return {
        hit: (pitches) => {
          return {
            for: (duration) => pitches.map((pitch) => new Hit(new Percussion(pitch), new Beat(beat, rational), duration)),
          };
        },
        play: (pitches) => {
          return {
            for: (duration) => pitches.map((pitch) => new Hit(new Note(pitch), new Beat(beat, rational), duration)),
          };
        },
      };
    }

    return new Sequence(
      120,
      [
        new Track(
          "Track 1",
          new Filter(
            "lowpass",
            1000,
            1,
            null,
            [
              new Envelope(
                {
                  attack: 0.01,
                  decay: 0.2,
                  sustain: 0.2,
                  release: 0.5,
                },
                [
                  new Wave('triangle'),
                  //new Noise(),
                ],
              ),
            ]
          ),
          flatten([
            on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for([1, 1]),
            on(3, [2, 4]).play(['C3']).for([1, 4]),
            on(4, [0, 0]).play(['C3']).for([1, 4]),
            on(4, [1, 4]).play(['C3']).for([1, 4]),
            on(4, [1, 2]).play(['C3']).for([1, 4]),
          ]),
          notes(['C3', 'A#3', 'G#2', 'G2', 'F2', 'D#2', 'D2', 'C2'])
        ),
        new Track(
          "Track 2",
          new Noise(),
          flatten([
            on(1, [0, 0]).hit(['Kick']).for([0, 0]),
            on(1, [0, 0]).hit(['ClosedHat']).for([0, 0]),
            on(1, [1, 2]).hit(['ClosedHat']).for([0, 0]),
            on(2, [0, 0]).hit(['Kick']).for([0, 0]),
            on(2, [0, 0]).hit(['Snare']).for([0, 0]),
            on(2, [0, 0]).hit(['ClosedHat']).for([0, 0]),
            on(2, [1, 2]).hit(['ClosedHat']).for([0, 0]),
            on(3, [0, 0]).hit(['Kick']).for([0, 0]),
            on(3, [0, 0]).hit(['ClosedHat']).for([0, 0]),
            on(3, [1, 2]).hit(['ClosedHat']).for([0, 0]),
            on(4, [0, 0]).hit(['Kick']).for([0, 0]),
            on(4, [0, 0]).hit(['Snare']).for([0, 0]),
            on(4, [0, 0]).hit(['ClosedHat']).for([0, 0]),
            on(4, [1, 2]).hit(['ClosedHat']).for([0, 0]),
          ]),
          notes(['ClosedHat', 'Snare', 'Kick'])
        ),
      ],
      new TimeSignature(4, 4)
    );
  }
  static parse(object) {
    return new Sequence(
      object.tempo,
      object.tracks.map((trackObject) => Track.parse(trackObject)),
      object.timeSignature
    );
  }
  get beats() {
    return memo(this, '_beats', () => {
      return flatten(
        range(1, this.timeSignature.beats).map((beat) => {
          return range(0, this.divisions - 1).map((numerator) => new Beat(beat, [numerator, this.divisions]));
        })
      );
    });
  }
  toggleHit(givenTrack, hit) {
    return this.replaceTrack(givenTrack, givenTrack.toggle(hit));
  }
  replaceTrack(before, after) {
    return new Sequence(
      this.tempo,
      this.tracks.map((track) => track === before ? after : track),
      this.timeSignature
    );
  }
  secondsPerBeat() {
    const minutesPerBeat = 1 / this.tempo;
    const secondsPerBeat = minutesPerBeat * 60;
    return secondsPerBeat;
  }
  /**
   * @param {AudioContext} audioContext
   * @param {AudioNode} destination
   * @param {Beat} beat
   *
   * @returns {Expiration[]}
   */
  play(audioContext, destination, beat) {
    const now = audioContext.currentTime;

    const expirations = flatten(
      this.tracks.map((track) => {
        return track.hitsOnBeat(beat).map((hit) => {
          const boundVoice = track.voice.bind(hit.note.frequency);
          const expiresOn = now + rationalAsFloat(hit.duration) * this.secondsPerBeat();

          return new Expiration(boundVoice, expiresOn);
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
    return new Sequence(
      newTempo,
      this.tracks,
      this.timeSignature
    );
  }
  setTrack(index, track) {
    const tracks = this.tracks.slice();
    tracks[index] = track;

    return new Sequence(
      this.tempo,
      tracks,
      this.timeSignature
    );
  }
};
