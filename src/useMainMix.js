import { useState, useMemo } from "react";

import { Gain, Binding } from "@jonathanhunsucker/audio-js";

export default function useMainMix(audioContext) {
  const [level, setLevel] = useState(0.3);

  const destination = useMemo(() => {
    return (new Binding(
      new Gain(level),
      null,
      []
    )).play(audioContext, audioContext.destination);
  }, [level, audioContext]);

  return [
    level,
    setLevel,
    destination,
  ];
}
