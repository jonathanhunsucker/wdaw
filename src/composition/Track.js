import { assert, instanceOf, aString, aMappingOf, anArrayOf } from "@/utility/type.js";
import { repackObject, repackArray } from "@/utility/functional.js";

import BarsBeatsSixteenths, { whole, quarter, none } from "@/music/BarsBeatsSixteenths.js";
import Period from "@/music/Period.js";

import { aPatch } from "@/audio/Patch.js";

import Placement from "./Placement.js";
import Phrase from "./Phrase.js";

export default class Track {
  constructor(name, kind, patches, placements, phrases) {
    assert(name, aString());
    assert(kind, aString());
    assert(patches, aMappingOf(aString(), aPatch()));
    assert(placements, anArrayOf(instanceOf(Placement)));
    assert(phrases, aMappingOf(aString(), instanceOf(Phrase)));

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
    return new Period(placement.beat, this.phrases[placement.phraseId].duration);
  }
  supports(feature) {
    if (feature === 'sustain') return this.kind === 'keys';
    if (feature === 'multipatch') return this.kind === 'drums';
    throw new Error(`Unknown feature \`${feature}\``);
  }
  getDefaultHitDuration() {
    if (this.kind === 'keys') return quarter;
    if (this.kind === 'drums') return none;
    throw new Error(`Unknown track kind \`${this.kind}\``);
  }
  setPatch(pitch, patch) {
    return new Track(
      this.name,
      this.kind,
      repackObject(this.patches).set(pitch, patch),
      this.placements,
      this.phrases
    );
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
  setPhrase(name, addition) {
    return new Track(
      this.name,
      this.kind,
      this.patches,
      this.placements,
      repackObject(this.phrases).set(name, addition)
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
  addPlacement(addition) {
    return new Track(
      this.name,
      this.kind,
      this.patches,
      this.placements.concat([addition]),
      this.phrases
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
