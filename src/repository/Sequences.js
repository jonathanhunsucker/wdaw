import Beat from "@/music/Beat.js";
import TimeSignature from "@/music/TimeSignature.js";

import Placement from "@/composition/Placement.js";
import Track from "@/composition/Track.js";
import Sequence from "@/composition/Sequence.js";

import { synth, hat, snare } from "./Patches.js";
import { cMinorToUpperC, cMinor, keyTick, drumTick, march } from "./Phrases.js";

export const basic = () => {
  return new Sequence(
    120,
    [
      new Track(
        "Track 1",
        'keys',
        {'*': synth()},
        [new Placement(new Beat(1, [0, 0]), 'cMinorToUpperC'), new Placement(new Beat(5, [0, 0]), 'cMinor')],
        {'cMinorToUpperC': cMinorToUpperC(), 'cMinor': cMinor()}
      ),
      new Track(
        "Track 2",
        'drums',
        {'ClosedHat': hat(), 'Kick': hat(), 'Snare': snare()},
        [new Placement(new Beat(1, [0, 0]), 'march'), new Placement(new Beat(5, [0, 0]), 'march')],
        {'march': march()}
      ),
    ],
    new TimeSignature(8, 4)
  );
};

export const timingExercise = () => {
  return new Sequence(
    120,
    [
      new Track(
        "Track 1",
        'keys',
        {'*': synth()},
        [new Placement(new Beat(1, [0, 0]), 'cMinorToUpperC'), new Placement(new Beat(5, [0, 0]), 'cMinor')],
        {'cMinorToUpperC': keyTick(), 'cMinor': keyTick()}
      ),
      new Track(
        "Track 2",
        'drums',
        {'ClosedHat': hat(), 'Kick': hat(), 'Snare': snare()},
        [new Placement(new Beat(1, [0, 0]), 'march'), new Placement(new Beat(5, [0, 0]), 'march')],
        {'march': drumTick()}
      ),
    ],
    new TimeSignature(8, 4)
  );
};
