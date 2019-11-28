import React from "react";

import { assert, instanceOf } from "@/utility/type.js";
import { flatten, range } from "@/utility/math.js";
import { equals } from "@/utility/rational.js";

import Phrase from "@/composition/Phrase.js";
import Hit from "@/composition/Hit.js";

import Beat from "@/music/Beat.js";
import Percussion from "@/music/Percussion.js";

import { Checkbox}  from "../input.js";
import { buildCellStyles } from "../style.js";

const { cellStyles, currentBeatStyles, rightAlignStyles } = buildCellStyles({  });

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

export default function PhraseEditor({ phrase, setPhrase }) {
  assert(phrase, instanceOf(Phrase));

  const divisions = 4;
  const stepSize = [1, divisions]; 

  const hitValue = (beat, note) => {
    const spanningHit = phrase.findHits({spans: beat, note: note})[0]
    if (spanningHit) {
      return spanningHit.period.beginsOn(beat) ? true : 'indeterminate';
    } else {
      return !!phrase.findHits({beginningOn: beat, note: note})[0];
    }
  };

  const toggleHit = (beat, note, value) => {
    const supportsSustain = phrase.supports('sustain');
    const defaultDuration = [1, 4]; // TODO
    if (supportsSustain === false && value === 'indeterminate') {
      return;
    }

    let spanningHit = phrase.findHits({spans: beat, note: note})[0];
    if (supportsSustain === false && !spanningHit) {
      spanningHit = phrase.findHits({beginningOn: beat, note: note})[0];
    }

    const toRemove = [];
    const toAdd = [];

    if (value === true) {
      // add a note on beat
      if (spanningHit) {
        throw new Error('tried to add note to beat which is already spanned');
      } else {
        toAdd.push(new Hit(note, beat, defaultDuration));
      }
    } else if (value === 'indeterminate') {
      // sustain an existing note further
      const hitWithClosestEnd = phrase.findHits({note: note, endsOnOrBefore: beat}).reduce((lastSoFar, candidate) => {
        if (lastSoFar === null) {
          return candidate;
        }

        const shouldTakeCandidate = rationalGreater(candidate.endingAsRational(), lastSoFar.endingAsRational());
        return shouldTakeCandidate ? candidate : lastSoFar;
      }, null);

      const duration = rationalDifference(
        rationalSum(beat.toRational(), stepSize),
        hitWithClosestEnd.beginningAsRational()
      );
      const adjusted = hitWithClosestEnd.adjustDurationTo(duration);

      toRemove.push(spanningHit);
      toAdd.push(adjusted);
    } else if (value === false) {
      // remove a hit, or shorten it
      if (spanningHit) {
        toRemove.push(spanningHit);
        if (spanningHit.period.beginsOn(beat) === false) {
          const duration = rationalDifference(beat.toRational(), spanningHit.beginningAsRational());
          const adjusted = spanningHit.adjustDurationTo(duration);
          toAdd.push(adjusted);
        }
      } else {
        throw new Error('tried to remove a note for which no spanning hit could be found');
      }
    }

    const phraseSansRemovals = toRemove.reduce((phrase, hit) => phrase.removeHit(hit), phrase);
    const phraseWithAdditions = toAdd.reduce((phrase, hit) => phrase.addHit(hit), phraseSansRemovals);

    setPhrase(phraseWithAdditions);
  }

  const beats = flatten(
    range(1, 4).map((beat) => {
      return range(0, divisions - 1).map((numerator) => new Beat(beat, [numerator, divisions]));
    })
  );

  const pitched = ['C3', 'A#3', 'G#2', 'G2', 'F2', 'D#2', 'D2', 'C2'];
  const percussive = ['ClosedHat', 'Snare', 'Kick'];
  const notes = (phrase.kind === 'keys' ? pitched : percussive).map((pitch) => UniversalNoteParser.parse(pitch));

  return (
    <table style={{borderCollapse: 'collapse'}}>
      <thead>
        <tr>
          <th style={cellStyles}></th>
          {beats.map((beat) =>
            <th key={beat.key} style={cellStyles}>
              {equals(beat.rational, [0, 0]) ? beat.beat : ''}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {notes.map((note, index) => (
          <tr key={note.pitch}>
            <td style={cellStyles}>{note.pitch}</td>
            {beats.map((beat) =>
              <td key={beat.key} style={cellStyles}>
                <Checkbox
                  value={hitValue(beat, note)}
                  onChange={(value) => toggleHit(beat, note, value)}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
