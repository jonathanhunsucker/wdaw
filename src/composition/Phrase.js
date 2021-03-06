import { assert, is, instanceOf, aString, any, aMappingOf, anArrayOf } from "@/utility/type.js";

import BarsBeatsSixteenths, { bar } from "@/music/BarsBeatsSixteenths.js";

export default class Phrase {
  constructor(kind, hits) {
    assert(kind, any([is('keys'), is('drums')]));
    this.name = 'my phrase';
    this.kind = kind;
    this.hits = hits;
    this.duration = bar;
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
      if (filters.hasOwnProperty('endsOnOrBefore')) {
        if (!(filters.endsOnOrBefore.after(hit.period.ending()) || filters.endsOnOrBefore.equals(hit.period.ending()))) {
          return false;
        }
      }

      return true;
    });
  }
}
