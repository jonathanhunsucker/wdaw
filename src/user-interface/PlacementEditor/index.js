import React from "react";

import BarsBeatsSixteenths from "@/music/BarsBeatsSixteenths.js";

export default function PlacementEditor({ placement, setPlacement, availablePhraseIds }) {
  function setPhrase(phraseId) {
    setPlacement(placement.setPhrase(phraseId));
  }

  function shift(part, amount) {
    setPlacement(placement.setBeat(placement.beat[amount > 0 ? 'plus' : 'minus'](
      {
        'bars': new BarsBeatsSixteenths(Math.abs(amount), 0, 0),
        'beats': new BarsBeatsSixteenths(0, Math.abs(amount), 0),
      }[part]
    )));
  }

  function decrement(part) {
    shift(part, -1);
  }

  function increment(part) {
    shift(part, 1);
  }

  return (<>
    <p>
      Phrase:{' '}
      <select value={placement.phraseId} onChange={(e) => setPhrase(e.target.value)}>
        {availablePhraseIds.map((phraseId) => {
          return (<option key={phraseId} value={phraseId}>{phraseId}</option>);
        })}
      </select>
    </p>
    <p>Bar: <button onClick={() => decrement('bars')}>-</button>{placement.beat.bars}<button onClick={() => increment('bars')}>+</button></p>
    <p>Beat: <button onClick={() => decrement('beats')}>-</button>{placement.beat.beats}<button onClick={() => increment('beats')}>+</button></p>
  </>);

}
