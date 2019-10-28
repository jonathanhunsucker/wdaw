import React, { Component, useState, useEffect, useRef } from "react";

import "./App.css";
import Server from "./Server.js";
import { Sequencer, Hit } from "./Sequencer.js";
import useInterval from "./useInterval.js";
import { silentPingToWakeAutoPlayGates } from "./audio/Nodes.js";
import Note from "./music/Note.js";
import Beat from "./music/Beat.js";
import { flatten } from "./math.js";

const audioContext = new (window.webkitAudioContext || window.AudioContext)();

function useSequencerState() {
  const [sequencer, setSequencer] = useState(Sequencer.fromNothing());
  const server = new Server("http://10.0.0.245:8000/");

  function publishAndSet(sequencer) {
    server.write(sequencer);
    set(sequencer);
  }

  function set(sequencer) {
    setSequencer(sequencer);
  }

  async function load() {
    set(Sequencer.parse(await server.read()));
  }

  useEffect(() => {
    load();
  }, []);

  useInterval(() => {
    load();
  }, 1000);

  function toggleHit(track, hit) {
    publishAndSet(sequencer.toggleHit(track, hit));
  }

  function setTempo(newTempo) {
    publishAndSet(sequencer.setTempo(newTempo));
  }

  const [currentBeat, setCurrentBeat] = useState(new Beat(1, [0, 0]));
  const [isPlaying, setIsPlaying] = useState(false);

  useInterval(() => {
    const tickSize = [1, sequencer.divisions];
    const nextBeat = currentBeat.next(tickSize, sequencer.timeSignature);
    setCurrentBeat(nextBeat);
    sequencer.play(audioContext, nextBeat);
  }, isPlaying ? 1000 / (sequencer.tempo / 60 * sequencer.divisions) : null);

  return [
    sequencer,
    toggleHit,
    setTempo,
    currentBeat,
    isPlaying,
    (newIsPlaying) => {
      silentPingToWakeAutoPlayGates(audioContext);
      setIsPlaying(newIsPlaying);
    },
  ];
}

function DumpJson(object) {
  return (<pre>{JSON.stringify(object, null, 2)}</pre>);
}

function App() {
  const [
    sequencer,
    toggleHit,
    setTempo,
    currentBeat,
    isPlaying,
    setIsPlaying,
  ] = useSequencerState();

  return (
    <div className="App">
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
      {DumpJson(sequencer)}
    </div>
  );
}

export default App;
