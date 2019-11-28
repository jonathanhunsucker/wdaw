import { useRef, useEffect } from "react";

export default function useKeystrokeMonitor(onPress, onRelease) {
  const onPressReference = useRef(onPress);
  const onReleaseReference = useRef(onRelease);

  useEffect(() => {
    onPressReference.current = onPress;
    onReleaseReference.current = onRelease;
  });

  const down = (event) => {
    if (event.repeat === true || event.altKey === true || event.ctrlKey === true || event.metaKey === true) {
      return;
    }

    onPressReference.current(event.code);
  };

  const up = (event) => {
    onReleaseReference.current(event.code);
  };

  useEffect(() => {
    document.addEventListener('keyup', up);
    document.addEventListener('keydown', down);

    return () => {
      document.removeEventListener('keyup', up);
      document.removeEventListener('keydown', down);
    };
  }, []);
}
