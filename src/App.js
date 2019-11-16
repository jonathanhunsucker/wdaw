import React, { Component, useState, useEffect, useRef, useMemo } from "react";

import Server from "./Server.js";
import { Sequence, Hit } from "./Sequence.js";
import useInterval from "./useInterval.js";
import { Note } from "@jonathanhunsucker/music-js";
import Beat from "./music/Beat.js";
import { flatten, rationalEquals, rationalDifference, rationalGreater, rationalLessEqual } from "./math.js";
import { DumpJson } from "./debug.js";

import { Gain, Binding, Filter, Envelope, Wave, Noise, silentPingToWakeAutoPlayGates } from "@jonathanhunsucker/audio-js";

import { key, offset, Keyboard } from "./Keyboard.js";
import PatchEditor, { ScaledInput, Percentage } from "./PatchEditor.js";
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

const Sequencer = React.memo(function Sequencer(props) {
  const sequence = props.sequence;

  const [
    currentBeat,
    [isPlaying, playerSetIsPlaying],
  ] = usePlayer(props.audioContext, props.destination, sequence);

  function hitValue(track, note, beat) {
    const spanningHit = track.findHits({spans: beat, note: note})[0]
    if (spanningHit) {
      return spanningHit.beginsOn(beat) ? true : 'indeterminate';
    } else {
      if (track.findHits({beginningOn: beat, note: note})[0]) {
        return true;
      }
      return false;
    }
  }

  function toggleHit(track, note, beat, value) {
    if (track.supports('sustain') === false && value === 'indeterminate') {
      return;
    }

    let spanningHit = track.findHits({spans: beat, note: note})[0];
    if (track.supports('sustain') === false && !spanningHit) {
      spanningHit = track.findHits({beginningOn: beat, note: note})[0];
    }

    const toRemove = [];
    const toAdd = [];

    if (value === true) {
      // add a note on beat
      if (spanningHit) {
        throw new Error('tried to add note to beat which is already spanned');
      } else {
        toAdd.push(new Hit(note, beat, track.defaultHitDuration));
      }
    } else if (value === 'indeterminate') {
      // sustain an existing note further
      const endsBeforeBeat = track.hits.filter((hit) => {
        return hit.note.equals(note) && rationalLessEqual(hit.endingAsRational(), beat.toRational());
      });

      const hitWithClosestEnd = endsBeforeBeat.reduce((lastSoFar, candidate) => {
        if (lastSoFar === null) {
          return candidate;
        }

        const shouldTakeCandidate = rationalGreater(candidate.endingAsRational(), lastSoFar.endingAsRational());
        return shouldTakeCandidate ? candidate : lastSoFar;
      }, null);

      const duration = rationalDifference(
        // BUG plus wraps modulo timeSignature, causing an negative difference, which explodes
        // IDEA separate modulo behavior into a helper, leaving plus to do straight math
        // IDEA replace plus with context-specific addition behavior, optionally employing modulo (where applicable to context)
        beat.plus(sequence.tickSize, sequence.timeSignature).toRational(),
        hitWithClosestEnd.beginningAsRational()
      );
      const adjusted = hitWithClosestEnd.adjustDurationTo(duration);

      toRemove.push(spanningHit);
      toAdd.push(adjusted);
    } else if (value === false) {
      // remove a hit, or shorten it
      if (spanningHit) {
        toRemove.push(spanningHit);
        if (spanningHit.beginsOn(beat) === false) {
          const duration = rationalDifference(beat.toRational(), spanningHit.beginningAsRational());
          const adjusted = spanningHit.adjustDurationTo(duration);
          toAdd.push(adjusted);
        }
      } else {
        throw new Error('tried to remove a note for which no spanning hit could be found');
      }
    }

    props.setSequence(
      sequence.replaceTrack(
        track,
        toAdd.reduce(
          (track, hit) => track.add(hit),
          toRemove.reduce((track, hit) => track.without(hit), track)
        )
      )
    );
  }

  function setTempo(newTempo) {
    props.setSequence(sequence.setTempo(newTempo));
  }

  function setIsPlaying(newIsPlaying) {
    silentPingToWakeAutoPlayGates(props.audioContext);
    playerSetIsPlaying(newIsPlaying);
  }

  const cellStyles = {borderStyle: 'ridge'};
  const currentBeatStyles = Object.assign({}, {backgroundColor: 'lightgrey'}, cellStyles);
  const rightAlignStyles = Object.assign({}, {textAlign: 'right'}, cellStyles);

  return (
    <React.Fragment>
      <p><button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'pause' : 'play'}</button></p>
      <p><input type="number" value={sequence.tempo} onChange={(e) => setTempo(parseInt(e.target.value, 10))} /></p>
      <table className="Sequencer" style={{borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th style={cellStyles}></th>
            <th style={cellStyles}></th>
            {sequence.beats.map((beat) =>
              <th key={beat.key} style={currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                {rationalEquals(beat.rational, [0, 0]) ? beat.beat : ''}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sequence.tracks.map((track, trackIndex) => {
            return flatten(
              track.notes.map((note, index) =>
                <tr key={note.pitch}>
                  {index === 0 && <td style={cellStyles} rowSpan={track.notes.length}>
                    <input
                      type="radio"
                      id={`track-${trackIndex}`}
                      value={trackIndex}
                      checked={trackIndex === props.selectedTrack}
                      onChange={(e) => {props.setSelectedTrack(parseInt(e.target.value, 10));}}
                    />{' '}
                    <label htmlFor={`track-${trackIndex}`}>{track.name}</label>
                  </td>}
                  <td style={rightAlignStyles}>{note.pitch}</td>
                  {sequence.beats.map((beat) =>
                    <td key={beat.key} style={currentBeat.equals(beat) ? currentBeatStyles : cellStyles}>
                      <Checkbox
                        value={hitValue(track, note, beat)}
                        onChange={(value) => toggleHit(track, note, beat, value)}
                      />
                    </td>
                  )}
                </tr>
              )
            );
          })}
        </tbody>
      </table>
    </React.Fragment>
  );
});

const Checkbox = React.memo(function Checkbox(props) {
  const checkboxRef = useRef(null);

  const indeterminate = props.value === 'indeterminate';
  const checked = props.value === true || indeterminate;

  useEffect(() => {
    checkboxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (e) => {
    const shiftWasPressed = e.nativeEvent.shiftKey;
    const isChecked = e.target.checked;

    const value = {
      [[true, true].toString()]: 'indeterminate',
      [['indeterminate', true].toString()]: false,
      [[false, true].toString()]: 'indeterminate',
      [[true, false].toString()]: false,
      [['indeterminate', false].toString()]: false,
      [[false, false].toString()]: true,
    }[[props.value, shiftWasPressed].toString()];

    props.onChange(value);
  };

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
    />
  );
});

function useExcisedUponRemovalList(excisor) {
  const list = useRef([]);

  return (policy, toAppend) => {
    const toRemove = [];
    const toKeep = [];

    list.current.forEach((item) => {
      if (policy(item)) {
        toRemove.push(item);
      } else {
        toKeep.push(item);
      }
    });

    toRemove.map(excisor);
    list.current = toKeep.concat(toAppend);
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
  const value = useMemo(() => {
    return new (window.webkitAudioContext || window.AudioContext)();
  });
  const ref = useRef(value);
  return ref.current;
}

function usePlayer(audioContext, destination, sequence) {
  const [currentBeat, setCurrentBeat] = useState(new Beat(1, [0, 0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const exciseByPolicyAndAppend = useExcisedUponRemovalList((expiration) => expiration.expire());

  const all = (expiration) => true;
  const expired = (expiration) => expiration.expiresBy(audioContext.currentTime);

  useInterval(() => {
    const newPendingExpirations = sequence.play(audioContext, destination, currentBeat);

    const nextBeat = currentBeat.plus(sequence.tickSize, sequence.timeSignature);
    setCurrentBeat(nextBeat);

    exciseByPolicyAndAppend(expired, newPendingExpirations);
  }, isPlaying ? sequence.secondsPerBeat() / sequence.divisions * 1000 : null);

  return [
    currentBeat,
    [
      isPlaying,
      (newIsPlaying) => {
        // sometimes when pausing, notes are left playing
        exciseByPolicyAndAppend(all, []);
        setIsPlaying(newIsPlaying);
      },
    ],
  ];
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

  return (
    <div className="App">
      <h1>Sequencer</h1>
      <p>Level:{' '}
        <ScaledInput
          base={1}
          value={level} min={0} max={1}
          onChange={(value) => setLevel(value)}
        />{' '}{Percentage(level)}
      </p>
      <Sequencer
        audioContext={audioContext}
        destination={destination}
        sequence={sequence}
        setSequence={setSequence}
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
      />

      <h1>Keyboard</h1>
      <p>Shift: {shift}</p>
      <Keyboard layout={layout} mapping={mapping} pressed={keysDownCurrently} onPress={onPress} onRelease={onRelease} />
      <PatchEditor patch={sequence.tracks[selectedTrack].voice} setPatch={setPatch} />
    </div>
  );
}

export default App;
