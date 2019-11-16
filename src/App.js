import React, { Component, useState, useEffect, useRef, useMemo } from "react";

import { Note } from "@jonathanhunsucker/music-js";
import { Gain, Binding } from "@jonathanhunsucker/audio-js";

import useInterval from "./useInterval.js";
import useKeystrokeMonitor from "./useKeystrokeMonitor.js";
import useSet from "./useSet.js";
import useDestructiveReadMap from "./useDestructiveReadMap.js";

import { DumpJson } from "./debug.js";
import { key, offset, Keyboard } from "./Keyboard.js";
import PatchEditor, { ScaledInput, Percentage } from "./PatchEditor.js";
import { Mapping, Handler } from "./KeyCommand.js";
import Server from "./Server.js";
import { Sequence, Hit, Percussion } from "./Sequence.js";
import { Sequencer } from "./Sequencer.js";

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

function useKeyboard(audioContext, destination, voice) {
  const [pressed, setPressed] = useState([]);

  const press = (note) => {
    const binding = voice.bind(note.frequency);
    binding.play(audioContext, destination);
    setPressed((p) => p.concat([[note.pitch, binding]]));
  };

  const release = (note) => {
    const pitchMatches = (pair) => pair[0] === note.pitch;

    setPressed((p) => {
      const candidates = p.filter(pitchMatches);
      if (candidates.length > 0) {
        candidates[0][1].release(audioContext);
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

function useAudioContext() {
  const value = useMemo(() => {
    return new (window.webkitAudioContext || window.AudioContext)();
  });
  const ref = useRef(value);
  return ref.current;
}

function useSyncronizedSequence(initialSequence) {
  const [sequence, setSequence] = useState(initialSequence);
  const server = new Server("http://10.0.0.245:8000/");

  async function load() {
    set(Sequence.parse(await server.read()));
  }

  const doLoad = () => {
    load();
  };

  useEffect(doLoad, []);
  useInterval(doLoad, 1000);

  function publishAndSet(sequence) {
    server.write(sequence);
    set(sequence);
  }

  function set(sequence) {
    setSequence(sequence);
  }

  return [
    sequence,
    (newSequence) => {
      publishAndSet(newSequence);
    },
  ];
}

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

function useMainMix(audioContext) {
  // BUG changes are not immediatly applied
  const [level, setLevel] = useState(0.3);

  const destination = useRef(null);

  const rebuildBinding = () => {
    destination.current = (new Binding(
      new Gain(level),
      null,
      []
    )).play(audioContext, audioContext.destination);
  };

  if (destination.current === null) {
    rebuildBinding();
  }

  useEffect(rebuildBinding, [audioContext, level]);

  return [
    level,
    setLevel,
    destination.current,
  ];
}

function useSequenceState() {
  const [sequence, setSequence] = useState(Sequence.fromNothing());
  return [sequence, setSequence];
}

function App() {
  const audioContext = useAudioContext();

  const [sequence, setSequence] = useSequenceState();

  const [
    level,
    setLevel,
    destination,
  ] = useMainMix(audioContext);

  const [selectedTrack, setSelectedTrack] = useState(1);

  const setPatch = (newPatch) => {
    setSequence(sequence.setTrack(selectedTrack, sequence.tracks[selectedTrack].setVoice(newPatch)));
  };

  const [pressed, press, release] = useKeyboard(audioContext, destination, sequence.tracks[selectedTrack].voice);

  const [shift, setShift] = useState(0);
  const [mod, setMod] = useState(false);
  const nudgeSize = mod ? 1 : 12;

  const translate = (note) => {
    return Note.fromStepsFromMiddleA(note.stepsFromMiddleA + shift);
  };

  if (selectedTrack === 0) {
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
  } else {
    const percussionHandler = (pitch, label) => new Handler(label || pitch, () => {
      press(pitch);
      return () => {};
    });
    var mapping = new Mapping({
      'KeyZ': percussionHandler('Kick'),
      'KeyX': percussionHandler('Snare'),
      'KeyC': percussionHandler('ClosedHat', 'Hat'),
    });
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

  return (
    <div className="App">
      <h1>Workstation</h1>
      <p>Level:{' '}
        <ScaledInput
          base={1}
          value={level} min={0} max={1}
          onChange={(value) => setLevel(value)}
        />{' '}{Percentage(level)}
      </p>

      <h2>Sequencer</h2>
      <Sequencer
        audioContext={audioContext}
        destination={destination}
        sequence={sequence}
        setSequence={setSequence}
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
      />

      <h2>Keyboard</h2>
      <Keyboard layout={layout} mapping={mapping} pressed={keysDownCurrently} onPress={onPress} onRelease={onRelease} />

      <h2>Patch</h2>
      <PatchEditor patch={sequence.tracks[selectedTrack].voice} setPatch={setPatch} />
    </div>
  );
}

export default App;
