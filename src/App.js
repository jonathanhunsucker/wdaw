import React, { Component, useState, useEffect, useRef } from "react";

import "./App.css";
import Sequencer from "./Sequencer.js";

function useSequencerState() {
  const [sequencer, setSequencer] = useState(new Sequencer(0));

  function setCount(count) {
    const updatedSequencer = sequencer.setCount(count);
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
