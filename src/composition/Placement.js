export default class Placement {
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

