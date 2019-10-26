import React, { Component, useState, useEffect, useRef } from "react";

import "./App.css";
import Server from "./Server.js";
import Sequencer from "./Sequencer.js";
import useInterval from "./useInterval.js";

function useSequencerState() {
  const [sequencer, setSequencer] = useState(new Sequencer(null));
  const server = new Server("http://10.0.0.245:8000/");

  async function load() {
    setSequencer(new Sequencer((await server.read()).count));
  }

  useEffect(() => {
    load();
  }, []);

  useInterval(() => {
    load();
  }, 1000);

  function setCount(count) {
    const updatedSequencer = sequencer.setCount(count);
    server.write(updatedSequencer);
    setSequencer(updatedSequencer);
  }

  return [sequencer, setCount];
}

function App() {
  const [sequencer, setCount] = useSequencerState();

  return (
    <div className="App">
      <h1>hello {sequencer.count}</h1>
      <button onClick={() => setCount(sequencer.count + 1)}>increment</button>
    </div>
  );
}

export default App;
