import { Envelope, Wave, Filter, Noise } from "@jonathanhunsucker/audio-js";
import { Note } from "@jonathanhunsucker/music-js";

import Beat from "./music/Beat.js";
import TimeSignature from "./music/TimeSignature.js";

import { flatten } from "./math.js";
import { Phrase, UniversalNoteParser, Hit, Sequence, Percussion, Track, Placement } from "./Sequence.js";
  
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

const phrases = {
  cMinorToUpperC: () => {
    return new Phrase('keys', flatten([
      on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for([1, 1]),
      on(3, [2, 4]).play(['C3']).for([1, 4]),
      on(4, [0, 0]).play(['C3']).for([1, 4]),
      on(4, [1, 4]).play(['C3']).for([1, 4]),
      on(4, [1, 2]).play(['C3']).for([1, 4]),
    ]));
  },
  cMinor: () => {
    return new Phrase('keys', flatten([
      on(2, [0, 0]).play(['C2', 'D#2', 'G2']).for([1, 1]),
    ]));
  },
  keyTick: () => {
    return new Phrase('keys', flatten([
      on(1, [0, 0]).play(['C4']).for([1, 4]),
      on(2, [0, 0]).play(['C3']).for([1, 4]),
      on(3, [0, 0]).play(['C3']).for([1, 4]),
      on(4, [0, 0]).play(['C3']).for([1, 4]),
    ]));
  },
  march: () => {
    return new Phrase('drums', flatten([
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
    ]));
  },
  drumTick: () => {
    return new Phrase('drums', flatten([
      on(1, [0, 0]).hit(['Kick']).for([0, 0]),
      on(2, [0, 0]).hit(['Kick']).for([0, 0]),
      on(3, [0, 0]).hit(['Kick']).for([0, 0]),
      on(4, [0, 0]).hit(['Kick']).for([0, 0]),
      on(1, [1, 2]).hit(['Kick']).for([0, 0]),
      on(2, [1, 2]).hit(['Kick']).for([0, 0]),
      on(3, [1, 2]).hit(['Kick']).for([0, 0]),
      on(4, [1, 2]).hit(['Kick']).for([0, 0]),
      on(1, [1, 4]).hit(['Kick']).for([0, 0]),
      on(2, [1, 4]).hit(['Kick']).for([0, 0]),
      on(3, [1, 4]).hit(['Kick']).for([0, 0]),
      on(4, [1, 4]).hit(['Kick']).for([0, 0]),
      on(1, [3, 4]).hit(['Kick']).for([0, 0]),
      on(2, [3, 4]).hit(['Kick']).for([0, 0]),
      on(3, [3, 4]).hit(['Kick']).for([0, 0]),
      on(4, [3, 4]).hit(['Kick']).for([0, 0]),
    ]));
  },
};

const patches = {
  synth: () => {
    return new Filter(
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
  },
  hat: () => {
    return new Filter(
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
  },
  snare: () => {
    return new Filter(
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
  },
};

class Repository {
  basic() {
    return new Sequence(
      120,
      [
        new Track(
          "Track 1",
          'keys',
          {'*': patches.synth()},
          [new Placement(new Beat(1, [0, 0]), 'cMinorToUpperC'), new Placement(new Beat(5, [0, 0]), 'cMinor')],
          {'cMinorToUpperC': phrases.cMinorToUpperC(), 'cMinor': phrases.cMinor()}
        ),
        new Track(
          "Track 2",
          'drums',
          {'ClosedHat': patches.hat(), 'Kick': patches.hat(), 'Snare': patches.snare()},
          [new Placement(new Beat(1, [0, 0]), 'march'), new Placement(new Beat(5, [0, 0]), 'march')],
          {'march': phrases.march()}
        ),
      ],
      new TimeSignature(4, 4)
    );
  }
  timingExercise() {
    return new Sequence(
      120,
      [
        new Track(
          "Track 1",
          'keys',
          {'*': patches.synth()},
          [new Placement(new Beat(1, [0, 0]), 'cMinorToUpperC'), new Placement(new Beat(5, [0, 0]), 'cMinor')],
          {'cMinorToUpperC': phrases.keyTick(), 'cMinor': phrases.keyTick()}
        ),
        new Track(
          "Track 2",
          'drums',
          {'ClosedHat': patches.hat(), 'Kick': patches.hat(), 'Snare': patches.snare()},
          [new Placement(new Beat(1, [0, 0]), 'march'), new Placement(new Beat(5, [0, 0]), 'march')],
          {'march': phrases.drumTick()}
        ),
      ],
      new TimeSignature(4, 4)
    );
  }
}
const SequenceRepository = new Repository();

export default SequenceRepository;
