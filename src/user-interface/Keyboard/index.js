import React, { useRef, useState, useEffect } from "react";

import { Note } from "@jonathanhunsucker/music-js";

import { max, sum } from "@/utility/math.js";

import Percussion from "@/music/Percussion.js";

import { Mapping, Handler } from "./KeyCommand.js";
import useKeystrokeMonitor from "./useKeystrokeMonitor.js";
import useSet from "./useSet.js";
import useDestructiveReadMap from "./useDestructiveReadMap.js";
import useKeyboard from "./useKeyboard.js";
import { qwerty } from "./Layout.js";
import square, { MARGIN } from "./square.js";

const Keyboard = React.memo(function Keyboard({ audioContext, destination, selectedTrack }) {
  const [pressed, press, release] = useKeyboard(audioContext, destination, selectedTrack);

  if (selectedTrack.kind === 'keys') {
    const [shift, setShift] = useState(0);
    const [mod, setMod] = useState(false);
    const nudgeSize = mod ? 1 : 12;

    const translate = (note) => {
      return Note.fromStepsFromMiddleA(note.stepsFromMiddleA + shift);
    };

    const noteHandler = (note) => new Handler(translate(note).pitch, () => {
      press(translate(note));
      return () => {
        release(translate(note));
      };
    });

    var mapping = new Mapping({
      'KeyZ': noteHandler(Note.fromStepsFromMiddleA(3)),
      'KeyS': noteHandler(Note.fromStepsFromMiddleA(4)),
      'KeyX': noteHandler(Note.fromStepsFromMiddleA(5)),
      'KeyD': noteHandler(Note.fromStepsFromMiddleA(6)),
      'KeyC': noteHandler(Note.fromStepsFromMiddleA(7)),
      'KeyV': noteHandler(Note.fromStepsFromMiddleA(8)),
      'KeyG': noteHandler(Note.fromStepsFromMiddleA(9)),
      'KeyB': noteHandler(Note.fromStepsFromMiddleA(10)),
      'KeyH': noteHandler(Note.fromStepsFromMiddleA(11)),
      'KeyN': noteHandler(Note.fromStepsFromMiddleA(12)),
      'KeyJ': noteHandler(Note.fromStepsFromMiddleA(13)),
      'KeyM': noteHandler(Note.fromStepsFromMiddleA(14)),
      'Comma': noteHandler(Note.fromStepsFromMiddleA(15)),

      'KeyQ': noteHandler(Note.fromStepsFromMiddleA(15)),
      'Digit2': noteHandler(Note.fromStepsFromMiddleA(16)),
      'KeyW': noteHandler(Note.fromStepsFromMiddleA(17)),
      'Digit3': noteHandler(Note.fromStepsFromMiddleA(18)),
      'KeyE': noteHandler(Note.fromStepsFromMiddleA(19)),
      'KeyR': noteHandler(Note.fromStepsFromMiddleA(20)),
      'Digit5': noteHandler(Note.fromStepsFromMiddleA(21)),
      'KeyT': noteHandler(Note.fromStepsFromMiddleA(22)),
      'Digit6': noteHandler(Note.fromStepsFromMiddleA(23)),
      'KeyY': noteHandler(Note.fromStepsFromMiddleA(24)),
      'Digit7': noteHandler(Note.fromStepsFromMiddleA(25)),
      'KeyU': noteHandler(Note.fromStepsFromMiddleA(26)),
      'KeyI': noteHandler(Note.fromStepsFromMiddleA(27)),

      'ShiftRight': new Handler('^', () => {
        setMod(true);
        return () => {
          setMod(false);
        };
      }),
      'Minus': new Handler(`-${nudgeSize}`, () => setShift((s) => s - nudgeSize)),
      'Equal': new Handler(`+${nudgeSize}`, () => setShift((s) => s + nudgeSize)),
    });
  } else if (selectedTrack.kind === 'drums') {
    const percussionHandler = (pitch, label) => new Handler(label || pitch, () => {
      press(new Percussion(pitch));
      return () => {};
    });
    var mapping = new Mapping({
      'KeyZ': percussionHandler('Kick'),
      'KeyX': percussionHandler('Snare'),
      'KeyC': percussionHandler('ClosedHat', 'Hat'),
    });
  } else {
    throw new Error(`Unknown track kind \`${selectedTrack.kind}\``);
  }

  const [keysDownCurrently, add, remove] = useSet([]);
  const [put, read] = useDestructiveReadMap({});

  const onPress = (code) => {
    add(code);
    put(code, mapping.onPress(code));
  };

  const onRelease = (code) => {
    remove(code);
    const handler = read(code);
    if (handler) {
      handler();
    }
  };

  useKeystrokeMonitor(onPress, onRelease);

  const maxWidth = qwerty
    .map((row) => row.map((item) => item.span).reduce(sum, 0) + row.length * MARGIN)
    .reduce(max, 0);

  return (
    <div>
      {qwerty.map((row, i) => {
        return (
          <div key={i} style={{overflow: "auto", with: "100%"}}>
            {row.map((item, j) => {
              return square(maxWidth, mapping, keysDownCurrently, onPress, onRelease, item);
            })}
          </div>
        );
      })}
    </div>
  );
});

export default Keyboard;
