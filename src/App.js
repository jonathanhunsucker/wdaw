import React, { Component, useState, useEffect, useRef } from "react";

import "./App.css";
import Server from "./Server.js";
import { Sequencer, Hit } from "./Sequencer.js";
import useInterval from "./useInterval.js";
import { Note } from "@jonathanhunsucker/music-js";
import Beat from "./music/Beat.js";
import { flatten } from "./math.js";
import { DumpJson } from "./debug.js";

import { Gain, Filter, Envelope, Wave, Noise, silentPingToWakeAutoPlayGates } from "@jonathanhunsucker/audio-js";

import { key, offset, Keyboard } from "./Keyboard.js";
import PatchEditor from "./PatchEditor.js";
import { Mapping, Handler } from "./KeyCommand.js";
import useKeystrokeMonitor from "./useKeystrokeMonitor.js";
import useSet from "./useSet.js";
import useDestructiveReadMap from "./useDestructiveReadMap.js";

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

function useKeyboard(audioContext, voice) {
  const [pressed, setPressed] = useState([]);

  const press = (note) => {
    const binding = voice.bind(note.frequency);
    binding.play(audioContext, audioContext.destination);
    setPressed((p) => p.concat([[note.pitch, binding]]));
  };

  const release = (note) => {
    const pitchMatches = (pair) => pair[0] === note.pitch;

    setPressed((p) => {
      const candidates = p.filter(pitchMatches);
      if (candidates.length > 0) {
        candidates[0][1].stop(audioContext);
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
  const ref = useRef(new (window.webkitAudioContext || window.AudioContext)());
  return ref.current;
}

function usePlayer(audioContext, sequencer) {
  const [currentBeat, setCurrentBeat] = useState(new Beat(1, [0, 0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingExpirations, setPendingExpirations] = useState([]);

  const all = (expiration) => true;
  const expired = (expiration) => expiration.isExpired();

  function expireByPolicy(policy) {
    const [dead, alive] = pendingExpirations.reduce((reduction, expiration) => {
      reduction[policy(expiration) ? 0 : 1].push(expiration);
      return reduction;
    }, [[], []]);

    dead.map((expiration) => expiration.expire());
    return alive;
  }

  useInterval(() => {
    const remainingAlive = expireByPolicy(expired);

    const tickSize = [1, sequencer.divisions];
    const nextBeat = currentBeat.plus(tickSize, sequencer.timeSignature);
    setCurrentBeat(nextBeat);
    const newPendingExpirations = sequencer.play(audioContext, nextBeat);

    setPendingExpirations(remainingAlive.concat(newPendingExpirations));
  }, isPlaying ? 1000 / (sequencer.tempo / 60 * sequencer.divisions) : null);

  return [
    currentBeat,
    [
      isPlaying,
      (newIsPlaying) => {
        // sometimes when pausing, notes are left playing
        expireByPolicy(all);
        setIsPlaying(newIsPlaying);
      },
    ],
  ];
}

function useSyncronizedSequencer(initialSequencer) {
  const [sequencer, setSequencer] = useState(initialSequencer);
  const server = new Server("http://10.0.0.245:8000/");

  async function load() {
    set(Sequencer.parse(await server.read()));
  }

  const doLoad = () => {
    load();
  };

  useEffect(doLoad, []);
  useInterval(doLoad, 1000);

  function publishAndSet(sequencer) {
    server.write(sequencer);
    set(sequencer);
  }

  function set(sequencer) {
    setSequencer(sequencer);
  }

  return [
    sequencer,
    (newSequencer) => {
      publishAndSet(newSequencer);
    },
  ];
}

function App() {
  const audioContext = useAudioContext();

  const [
    sequencer,
    setSequencer,
  //] = useSyncronizedSequencer(Sequencer.fromNothing());
  ] = useState(Sequencer.fromNothing(
    new Filter(
      "lowpass",
      1000,
      1,
      null,
      [
        new Envelope(
          {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.1,
            release: 0.5,
          },
          [
            new Wave('triangle'),
            //new Noise(),
          ],
        ),
      ]
    )
  ));

  const setPatch = (newPatch) => {
    setSequencer(sequencer.setTrack(0, sequencer.tracks[0].setVoice(newPatch)));
  };

  const [
    currentBeat,
    [isPlaying, playerSetIsPlaying],
  ] = usePlayer(audioContext, sequencer);

  function toggleHit(track, hit) {
    setSequencer(sequencer.toggleHit(track, hit));
  }

  function setTempo(newTempo) {
    setSequencer(sequencer.setTempo(newTempo));
  }

  function setIsPlaying(newIsPlaying) {
    silentPingToWakeAutoPlayGates(audioContext);
    playerSetIsPlaying(newIsPlaying);
  }

  const [level, setLevel] = useState(0.1);

  const voice = new Gain(level, [sequencer.tracks[0].voice]);

  const [pressed, press, release] = useKeyboard(audioContext, voice);
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

  const mapping = new Mapping({
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

  return (
    <div className="App">
      <h1>Sequencer</h1>
      <p>Level: <input type="range" min="0" step="0.01" max="1.0" value={level} onChange={(e) => {setLevel(e.target.valueAsNumber)}} /></p>
      <p>now: {audioContext.currentTime}</p>
      <p><button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'pause' : 'play'}</button></p>
      <p><input type="number" value={sequencer.tempo} onChange={(e) => setTempo(parseInt(e.target.value, 10))} /></p>
      <table className="Sequencer">
        <thead>
          <tr>
            <th></th>
            <th></th>
            {sequencer.beats.map((beat) =>
              <th key={beat.key} style={{backgroundColor: currentBeat.equals(beat) ? 'lightgrey' : 'transparent'}}>
                {beat.beat}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sequencer.tracks.map((track) => {
            const range = Note.range(new Note('C2'), new Note('C3')).reverse();
            return flatten(
              range.map((note, index) =>
                <tr key={note.pitch}>
                  {index === 0 && <td rowSpan={range.length}>{track.name}</td>}
                  <td>{note.pitch}</td>
                  {sequencer.beats.map((beat) =>
                    <td key={beat.key} style={{backgroundColor: currentBeat.equals(beat) ? 'lightgrey' : 'transparent'}}>
                      <input
                        type="checkbox"
                        checked={track.hasHit(new Hit(note, beat))}
                        onChange={() => toggleHit(track, new Hit(note, beat))}
                      />
                    </td>
                  )}
                </tr>
              )
            );
          })}
        </tbody>
      </table>

      <h1>Keyboard</h1>
      <p>Shift: {shift}</p>
      <Keyboard layout={layout} mapping={mapping} pressed={keysDownCurrently} onPress={onPress} onRelease={onRelease} />
      <PatchEditor patch={sequencer.tracks[0].voice} setPatch={setPatch} />

      <h1>Debugging</h1>
      <h4>Sequencer</h4>
      {DumpJson(sequencer)}
      <h4>Patch</h4>
      {DumpJson(sequencer.tracks[0].voice)}
    </div>
  );
}

export default App;
