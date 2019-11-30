import { assert, instanceOf } from "@/utility/type.js";

import BarsBeatsSixteenths from "@/music/BarsBeatsSixteenths.js";

export default class Placement {
  constructor(beat, phraseId) {
    assert(beat, instanceOf(BarsBeatsSixteenths));
    this.beat = beat;
    this.phraseId = phraseId;
  }
  setBeat(replacementBeat) {
    return new Placement(
      replacementBeat,
      this.phraseId
    );
  }
  setPhrase(replacementPhraseId) {
    return new Placement(
      this.beat,
      replacementPhraseId
    );
  }
}

