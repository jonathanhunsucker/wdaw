import { useRef, useMemo } from "react";

export default function useAudioContext() {
  const value = useMemo(() => {
    return new (window.webkitAudioContext || window.AudioContext)();
  });
  const ref = useRef(value);
  return ref.current;
}
