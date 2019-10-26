import React, { Component, useState, useEffect, useRef } from "react";

import "./App.css";
import Server from "./Server.js";
import Sequencer from "./Sequencer.js";
import useInterval from "./useInterval.js";

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

  useInterval(() => {
    console.log('tick');
  }, 1000 / (sequencer.tempo / 60));

  return [
    sequencer,
    toggleHit,
    setTempo,
  ];
}

function DumpJson(object) {
  return (<pre>{JSON.stringify(object, null, 2)}</pre>);
}

function App() {
  const [sequencer, toggleHit, setTempo] = useSequencerState();

  return (
    <div className="App">
      <h1>hello {sequencer.count}</h1>
      <p><input type="number" value={sequencer.tempo} onChange={(e) => setTempo(parseInt(e.target.value, 10))} /></p>
      <table className="Sequencer">
        <thead>
          <tr>
          <th></th>
            {sequencer.beats.map((beat) =>
              <th key={beat}>{beat}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sequencer.tracks.map((track) =>
            <tr key={track}>
              <td>{track.name}</td>
              {sequencer.beats.map((beat) =>
                <td key={beat}>
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
