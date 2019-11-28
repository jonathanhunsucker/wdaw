import React, { useRef, useMemo } from "react";

export default function useWebAudioAPIClock(context, tick) {
  const tickReference = useRef();
  tickReference.current = tick;
  const node = useMemo(() => {
    // BUG createScriptProcessor is a deprecated API
    const node = context.createScriptProcessor(256, 1, 1);
    node.connect(context.destination);
    node.onaudioprocess = () => tickReference.current();
    return node;
  }, [context, tick]);
  const clock = useRef(node);
}
