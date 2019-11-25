import { Binding, stageFactory, Gain, Envelope, Wave, Filter, Noise } from "@jonathanhunsucker/audio-js";
import { Note } from "@jonathanhunsucker/music-js";
import Beat from "./music/Beat.js";
import TimeSignature from "./music/TimeSignature.js";
import { range, flatten, rationalEquals, rationalSum, rationalGreaterEqual, rationalLess, rationalLessEqual, rationalDifference, rationalAsFloat } from "./math.js";

import { useState, useMemo } from "react";

function zip(accumulation, entry) {
  if (!accumulation) {
    accumulation = {};
  }

  accumulation[entry[0]] = entry[1];
  return accumulation;
}

// will walk and talk like a note, but for representing percusive notes instead of scientific pitch notation
// eventually, should be rolled back into music-js
export class Percussion {
  constructor(pitch) {
    this.pitch = pitch;
  }
  equals(percussion) {
    return this.pitch === percussion.pitch;
  }
}

// front for Percussion or Note
export class UniversalNoteParser {
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
    const doesExpire = moment > this.expiresOn;
    return doesExpire;
  }
  expire() {
    this.binding.release();
  }
}

class Period {
  constructor(beat, duration) {
    this.beat = beat;
    this.duration = duration;
  }
  beginningAsRational() {
    return this.beat.toRational();
  }
  endingAsRational() {
    return rationalSum(this.beginningAsRational(), this.duration);
  }
  beginsOn(beat) {
    return this.beat.equals(beat);
  }
  spans(beat) {
    const startsOnOrAfter = rationalGreaterEqual(beat.toRational(), this.beginningAsRational());
    const endsStrictlyBefore = rationalLess(beat.toRational(), this.endingAsRational());

    return startsOnOrAfter && endsStrictlyBefore;
  }
  equals(period) {
    return this.beat.equals(period.beat) && rationalEquals(this.duration, period.duration);
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
  get period() {
    return new Period(this.beat, this.duration);
  }
  equals(hit) {
    return this.note.equals(hit.note) && this.period.equals(hit.period);
  }
  adjustDurationTo(duration) {
    return new Hit(
      this.note,
      this.beat,
      duration
    );
  }
}

function repack(object) {
  return {
    replace: (before, after) => {
      return Object.entries(object).map(([key, value]) => [key, value === before ? after : value]).reduce(zip, {});
    },
  };
}

function repackArray(array) {
  return {
    replace: (before, after) => {
      return array.map((item) => item === before ? after : item);
    },
  };
}

class Placement {
  constructor(beat, phrase) {
    this.beat = beat;
    this.phrase = phrase;
  }
  get period() {
    return new Period(this.beat, [this.phrase.duration, 1]);
  }
  setPhrase(replacementPhrase) {
    const replacement = new Placement(
      this.beat,
      replacementPhrase
    );
    return replacement;
  }
}

class Track {
  constructor(name, kind, patches, placements, notes) {
    this.name = name;
    this.kind = kind;
    this.patches = patches;
    this.placements = placements;
  }
  patchForPitch(pitch) {
    if (pitch && this.patches.hasOwnProperty(pitch)) {
      return this.patches[pitch];
    }

    if (this.patches.hasOwnProperty('*')) {
      return this.patches['*'];
    }

    return false;
  }
  supports(feature) {
    if (feature === 'sustain') return this.kind === 'keys';
    if (feature === 'multipatch') return this.kind === 'drums';
    throw new Error(`Unknown feature \`${feature}\``);
  }
  getDefaultHitDuration() {
    if (this.kind === 'keys') return [1, 4];
    if (this.kind === 'drums') return [0, 0];
    throw new Error(`Unknown track kind \`${this.kind}\``);
  }
  replacePatch(before, after) {
    return new Track(
      this.name,
      this.kind,
      repack(this.patch).replace(before, after),
      this.phrases
    );
  }
  replacePlacement(before, after) {
    const replaced = new Track(
      this.name,
      this.kind,
      this.patches,
      repackArray(this.placements).replace(before, after),
    );
    return replaced;
  }
}

class Phrase {
  constructor(kind, hits) {
    this.name = 'my phrase';
    this.kind = kind;
    this.hits = hits;
    this.duration = 4;
  }
  supports(feature) {
    if (feature === 'sustain') return this.kind === 'keys';
    if (feature === 'multipatch') return this.kind === 'drums';
    throw new Error(`Unknown feature \`${feature}\``);
  }
  addHit(subject) {
    return new Phrase(this.kind, this.hits.concat(subject));
  }
  removeHit(subject) {
    return new Phrase(this.kind, this.hits.filter((hit) => hit !== subject));
  }
  findHits(filters) {
    return this.hits.filter((hit) => {
      if (filters.hasOwnProperty('note') && !hit.note.equals(filters.note)) return false;
      if (filters.hasOwnProperty('spans') && !hit.period.spans(filters.spans)) return false;
      if (filters.hasOwnProperty('beginningOn') && !hit.period.beginsOn(filters.beginningOn)) return false;
      if (filters.hasOwnProperty('endsOnOrBefore') && !rationalLessEqual(hit.endingAsRational(), filters.endsOnOrBefore.toRational())) return false;

      return true;
    });
  }
}

export class Sequence {
  constructor(tempo, tracks, timeSignature) {
    this.tempo = tempo;
    this.tracks = tracks;
    this.timeSignature = new TimeSignature(8, 4);
    this.divisions = 4;
    this.tickSize = [1, 4];
  }
  static fromNothing() {
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

    const synth = new Filter(
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
          ],
        ),
      ]
    );

    const hat = new Filter(
      "bandpass",
      12000,
      1,
      null,
      [
        new Envelope(
          {
            attack: 0.001,
            decay: 0.050,
            sustain: 0,
            release: 0.050,
          },
          [
            new Noise(),
          ]
        ),
      ]
    );

    const snare = new Filter(
      "bandpass",
      5000,
      1,
      null,
      [
        new Envelope(
          {
            attack: 0.001,
            decay: 0.050,
            sustain: 0,
            release: 0.050,
          },
          [
            new Noise(),
          ]
        ),
      ]
    );

    const phrases = {
      cMinorToUpperC: new Phrase('keys', flatten([
        on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for([1, 1]),
        on(3, [2, 4]).play(['C3']).for([1, 4]),
        on(4, [0, 0]).play(['C3']).for([1, 4]),
        on(4, [1, 4]).play(['C3']).for([1, 4]),
        on(4, [1, 2]).play(['C3']).for([1, 4]),
      ])),
      march: new Phrase('drums', flatten([
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
      ])),
    };

    const tracks = [
      new Track(
        "Track 1",
        'keys',
        {'*': synth},
        [
          new Placement(new Beat(2, [0, 0]), phrases.cMinorToUpperC),
          new Placement(new Beat(3, [0, 0]), phrases.cMinorToUpperC),
        ]
      ),
      new Track(
        "Track 2",
        'drums',
        {'ClosedHat': hat, 'Kick': hat, 'Snare': snare},
        [new Placement(new Beat(1, [0, 0]), phrases.march)]
      ),
    ];

    return new Sequence(
      120,
      tracks,
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
    return new Sequence(
      this.tempo,
      repackArray(this.tracks).replace(before, after),
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
          const boundPatch = track.patchForPitch(hit.note.pitch).bind(hit.note.frequency);
          // BUG 50ms breathing room, should be determined by the track's patch, not hardcoded
          const expiresOn = now + Math.max(rationalAsFloat(hit.duration) * this.secondsPerBeat(), 0.050);

          return new Expiration(boundPatch, expiresOn);
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
};

const defaultSequence = Sequence.fromNothing();
const defaultTrackFromSequence = (sequence) => sequence.tracks[0];
const defaultPatchFromTrack = (track) => Object.entries(track.patches)[0][1];
const defaultPitchFromTrack = (track) => Object.keys(track.patches)[0];

export function useSequenceState() {
  const [state, setState] = useState({
    sequence: defaultSequence,
    selectedTrack: 0,
    selectedPitch: defaultPitchFromTrack(defaultTrackFromSequence(defaultSequence)),
  });
  const selectedTrack = state.sequence.tracks[state.selectedTrack];
  const selectedPatch = selectedTrack.patchForPitch(state.selectedPitch);

  const setSequence = (replacementSequence) => {
    setState({
      sequence: replacementSequence,
      selectedTrack: state.selectedTrack,
      selectedPitch: Object.keys(selectedTrack.patches).includes(state.selectedPitch) ? state.selectedPitch : defaultPitchFromTrack(selectedTrack),
    });
  };

  const setSelectedTrack = (replacementTrack) => {
    setState({
      sequence: state.sequence,
      selectedTrack: state.sequence.tracks.indexOf(replacementTrack),
      selectedPitch: defaultPitchFromTrack(replacementTrack),
    });
  };

  const setSelectedPitch = (replacementPitch) => {
    setState({
      sequence: state.sequence,
      selectedTrack: state.selectedTrack,
      selectedPitch: replacementPitch,
    });
  };

  const setSelectedPatch = (patch) => {
    const replacementSequence = state.sequence.replaceTrack(
      selectedTrack,
      selectedTrack.replacePatch(selectedPatch, patch)
    );
    setState({
      sequence: replacementSequence,
      selectedTrack: state.selectedTrack,
      selectedPitch: state.selectedPitch,
    });
  };

  return [
    [state.sequence, setSequence],
    [selectedTrack, setSelectedTrack],
    [state.selectedPitch, setSelectedPitch],
    [selectedPatch, setSelectedPatch],
  ];
};
