import React from "react";

export default function BeatLabel(beat) {
  return beat.isRound() ? beat.beats + 1 : '';
}
