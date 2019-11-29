import { assert, instanceOf } from "@/utility/type.js";
import { repackObject, repackArray } from "@/utility/functional.js";

import Period from "@/music/Period.js";

import Phrase from "./Phrase.js";

export default class Track {
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
    return Period.fromBeatDuration(placement.beat, [this.phrases[placement.phraseId].duration, 1]);
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
