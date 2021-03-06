import React, { useState, useRef } from "react";

function removeFirst(criteria) {
  var hasRemoved = false;
  return (item) => {
    const shouldRemove = criteria(item);
    if (shouldRemove === true && hasRemoved === false) {
      hasRemoved = true;
      return false;
    }

    return true;
  };
}

// public interface of useState, but backed by a ref, and only supports functional updates
// avoids inducing re-renders in parent component
function useStatelikeRef(initialValue) {
  const reference = useRef(initialValue);
  const setter = (operation) => reference.current = operation(reference.current);

  return [reference.current, setter];
}

/**
 * Take an audioContext, destination, and track, and return a list of:
 *  - currently pressed pitch/binding pairs
 *  - function to press a note
 *  - function to release a note
 *
 * @param {AudioContext} audioContext - Arena of play
 * @param {AudioNode} destination - Where to pipe the output to
 * @param {Patch} patch - Instance of a `Stage` from @jonathanhunsucker/audio-js
 *
 * @returns {[{0: string, 1: Binding}[], func(Note), function(Note)]}
 */
export default function useKeyboard(audioContext, destination, track) {
  const [pressed, setPressed] = useStatelikeRef([]);

  const press = (note) => {
    const binding = track.patchForPitch(note.pitch).bind(note.frequency);
    binding.play(audioContext, destination, audioContext.currentTime);
    setPressed((p) => p.concat([[note.pitch, binding]]));
  };

  const release = (note) => {
    const pitchMatches = (pair) => pair[0] === note.pitch;

    setPressed((p) => {
      const candidates = p.filter(pitchMatches);
      if (candidates.length > 0) {
        const binding = candidates[0][1];
        binding.release();
      }
      return p.filter(removeFirst(pitchMatches));
    });
  };

  return [
    pressed,
    press,
    release,
  ];
}
