import React, { Component, useState, useEffect, useRef } from "react";

import "./App.css";
import Server from "./Server.js";
import Sequencer from "./Sequencer.js";
import useInterval from "./useInterval.js";

const audioContext = new (window.webkitAudioContext || window.AudioContext)();

function silentPingToWakeAutoPlayGates(audioContext) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 440;
  oscillator.start(oscillator.context.currentTime);
  oscillator.stop(oscillator.context.currentTime + 0.3);

  const gain = audioContext.createGain();
  gain.gain.value = 0.0;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
}

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

  function toggleHit(track, beat) {
    publishAndSet(sequencer.toggleHit(track, beat));
  }

  function setTempo(newTempo) {
    publishAndSet(sequencer.setTempo(newTempo));
  }

  const [currentBeat, setCurrentBeat] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useInterval(() => {
    const nextBeat = currentBeat === sequencer.numberOfBeats ? 1 : currentBeat + 1;
    setCurrentBeat(nextBeat);
  }, isPlaying ? 1000 / (sequencer.tempo / 60) : null);

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
            {sequencer.beats.map((beat) =>
              <th key={beat} style={{backgroundColor: currentBeat === beat ? 'lightgrey' : 'transparent'}}>
                {beat}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sequencer.tracks.map((track) =>
            <tr key={track}>
              <td>{track.name}</td>
              {sequencer.beats.map((beat) =>
                <td key={beat} style={{backgroundColor: currentBeat === beat ? 'lightgrey' : 'transparent'}}>
                  <input
                    type="checkbox"
                    checked={track.hasHitOnBeat(beat)}
                    onChange={() => toggleHit(track, beat)}
                  />
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
      {DumpJson(sequencer)}
    </div>
  );
}

export default App;
