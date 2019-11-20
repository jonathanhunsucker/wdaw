import React, { useRef, useState, useEffect } from "react";

import { Note } from "@jonathanhunsucker/music-js";

import useKeystrokeMonitor from "./useKeystrokeMonitor.js";
import useSet from "./useSet.js";
import useDestructiveReadMap from "./useDestructiveReadMap.js";
import useKeyboard from "./useKeyboard.js";
import { Percussion } from "./Sequence.js";

import { Mapping, Handler } from "./KeyCommand.js";

const MARGIN = 0.1;

const layout = [
  [
    key("Digit1"),
    key("Digit2"),
    key("Digit3"),
    key("Digit4"),
    key("Digit5"),
    key("Digit6"),
    key("Digit7"),
    key("Digit8"),
    key("Digit9"),
    key("Digit0"),
    key("Minus"),
    key("Equal"),
  ],
  [
    offset(0.5),
    key("KeyQ"),
    key("KeyW"),
    key("KeyE"),
    key("KeyR"),
    key("KeyT"),
    key("KeyY"),
    key("KeyU"),
    key("KeyI"),
    key("KeyO"),
    key("KeyP"),
    key("BracketLeft"),
    key("BracketRight"),
  ],
  [
    offset(0.8),
    key("KeyA"),
    key("KeyS"),
    key("KeyD"),
    key("KeyF"),
    key("KeyG"),
    key("KeyH"),
    key("KeyJ"),
    key("KeyK"),
    key("KeyL"),
    key("Semicolon"),
    key("Quote"),
  ],
  [
    offset(1),
    key("KeyZ"),
    key("KeyX"),
    key("KeyC"),
    key("KeyV"),
    key("KeyB"),
    key("KeyN"),
    key("KeyM"),
    key("Comma"),
    key("Period"),
    key("Slash"),
    key("ShiftRight", 1.5),
  ],
];

function codeToColor(mapping, pressed, code) {
  if (code === null) {
    return "transparent";
  }

  if (mapping.contains(code) === false) {
    return "lightgrey";
  }

  if (pressed.indexOf(code) === -1) {
    return "grey";
  }

  return "black";
}

function label(mapping, pressed, code) {
  if (mapping.contains(code) === false) {
    return "";
  }

  if (pressed.indexOf(code) === -1) {
    return mapping.label(code);
  }

  return <b>{mapping.label(code)}</b>;
}

export function key(code, span) {
  return {
    code: code,
    span: span || 1,
  };
}

export function offset(span) {
  return key(null, span);
}

function square(maxWidth, mapping, pressed, onPress, onRelease, key) {
  const basis = 100.0 / maxWidth;
  const width = key.span * basis;

  const onPointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    onPress(key.code);
  };

  const onPointerUp = (e) => {
    onRelease(key.code);
  };

  const onPointerCancel = (e) => {
    onRelease(key.code);
  };

  return (
    <div
      key={key.code}
      style={{
        background: codeToColor(mapping, pressed, key.code),
        float: "left",
        color: "white",
        display: "inline-block",
        fontSize: `${basis/2}vw`,
        width: `${width}vw`,
        lineHeight: `${basis}vw`,
        height: `${basis}vw`,
        margin: `${MARGIN}vw`,
        textAlign: "center",
        verticalAlign: "middle",
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      >
      {label(mapping, pressed, key.code)}
    </div>
  );
}

function max(accumulator, item) {
  return Math.max(accumulator, item);
}

function sum(accumulator, item) {
  return accumulator + item;
}

export const Keyboard = React.memo(function Keyboard({ audioContext, destination, selectedTrack }) {
  const [pressed, press, release] = useKeyboard(audioContext, destination, selectedTrack);

  const [shift, setShift] = useState(0);
  const [mod, setMod] = useState(false);
  const nudgeSize = mod ? 1 : 12;

  const translate = (note) => {
    return Note.fromStepsFromMiddleA(note.stepsFromMiddleA + shift);
  };

  if (selectedTrack.kind === 'keys') {
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

  const maxWidth = layout
    .map((row) => row.map((item) => item.span).reduce(sum, 0) + row.length * MARGIN)
    .reduce(max, 0);

  return (
    <div>
      {layout.map((row, i) => {
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

