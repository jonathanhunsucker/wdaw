import { useState, useMemo } from "react";

import { Binding, Gain } from "@jonathanhunsucker/audio-js";

import { range, flatten, rationalEquals, rationalSum, rationalGreaterEqual, rationalLess, rationalLessEqual, rationalAsFloat } from "./math.js";
import Beat from "./music/Beat.js";
import TimeSignature from "./music/TimeSignature.js";
import { assert, instanceOf } from "./types.js";

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

function repackObject(object) {
  return {
    replaceValue: (before, after) => {
      return Object.entries(object).map(([key, value]) => [key, value === before ? after : value]).reduce(zip, {});
    },
  };
}

function repackArray(array) {
  return {
    replaceItem: (before, after) => {
      return array.map((item) => item === before ? after : item);
    },
  };
}

export class Placement {
  constructor(beat, phraseId) {
    this.beat = beat;
    this.phraseId = phraseId;
  }
  setPhrase(replacementPhraseId) {
    const replacement = new Placement(
      this.beat,
      replacementPhraseId
    );
    return replacement;
  }
}

export class Track {
  constructor(name, kind, patches, placements, phrases) {
    this.name = name;
    this.kind = kind;
    this.patches = patches;
    this.placements = placements;
    this.phrases = phrases;
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
  getPeriodFromPlacement(placement) {
    return new Period(placement.beat, [this.phrases[placement.phraseId].duration, 1]);
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
      repackObject(this.patches).replaceValue(before, after),
      this.placements,
      this.phrases
    );
  }
  replacePhrase(before, after) {
    assert(before, instanceOf(Phrase));
    assert(after, instanceOf(Phrase));

    return new Track(
      this.name,
      this.kind,
      this.patches,
      this.placements,
      repackObject(this.phrases).replaceValue(before, after)
    );
  }
  replacePlacement(before, after) {
    const replaced = new Track(
      this.name,
      this.kind,
      this.patches,
      repackArray(this.placements).replaceItem(before, after),
      this.phrases
    );
    return replaced;
  }
}

export class Phrase {
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
      repackArray(this.tracks).replaceItem(before, after),
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
   * @param {float} time
   *
   * @returns {Expiration[]}
   */
  schedule(audioContext, destination, beat, time) {
    const expirations = flatten(
      this.tracks.map((track) => {
        return track.placements.map((placement) => {
          const period = track.getPeriodFromPlacement(placement);
          if (period.spans(beat) === false) {
            return [];
          }

          const relativeBeat = beat.minus(placement.beat);

          return track.phrases[placement.phraseId].findHits({beginningOn: relativeBeat}).map((hit) => {
            const boundPatch = track.patchForPitch(hit.note.pitch).bind(hit.note.frequency);
            // BUG 50ms breathing room, should be determined by the track's patch, not hardcoded
            const expiresOn = time + Math.max(rationalAsFloat(hit.duration) * this.secondsPerBeat(), 0.050);
            return new Expiration(boundPatch, expiresOn);
          });
        });
      })
    );

    const binding = new Binding(
      new Gain(1.0),
      null,
      expirations.map((expiration) => expiration.binding)
    );

    binding.play(audioContext, destination, time);

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
