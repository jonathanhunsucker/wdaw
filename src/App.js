import React, { Component, useState, useEffect, useRef } from "react";

import "./App.css";
import Server from "./Server.js";
import { Sequencer, Hit } from "./Sequencer.js";
import useInterval from "./useInterval.js";
import { silentPingToWakeAutoPlayGates } from "./audio/Nodes.js";
import Note from "./music/Note.js";
import Beat from "./music/Beat.js";
import { flatten } from "./math.js";
import { DumpJson } from "./debug.js";

const audioContext = new (window.webkitAudioContext || window.AudioContext)();

function usePlayer(sequencer) {
  const [currentBeat, setCurrentBeat] = useState(new Beat(1, [0, 0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingExpirations, setPendingExpirations] = useState([]);

  function expireAll() {
    pendingExpirations.map((pendingExpiration) => pendingExpiration.expire());
    setPendingExpirations([]);
  }

  useInterval(() => {
    expireAll();

    const tickSize = [1, sequencer.divisions];
    const nextBeat = currentBeat.next(tickSize, sequencer.timeSignature);
    setCurrentBeat(nextBeat);
    const newPendingExpirations = sequencer.play(audioContext, nextBeat);

    setPendingExpirations(newPendingExpirations);
  }, isPlaying ? 1000 / (sequencer.tempo / 60 * sequencer.divisions) : null);

  return [
    currentBeat,
    [
      isPlaying,
      (newIsPlaying) => {
        // sometimes when pausing, notes are left playing
        expireAll();
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
  const [
    sequencer,
    setSequencer,
  ] = useSyncronizedSequencer(Sequencer.fromNothing());

  const [
    currentBeat,
    [isPlaying, playerSetIsPlaying],
  ] = usePlayer(sequencer);

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

  return (
    <div className="App">
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
      {DumpJson(sequencer)}
    </div>
  );
}

export default App;
