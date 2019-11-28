import { useRef } from "react";

export default function useExcisedUponRemovalList(excisor) {
  const list = useRef([]);

  return (policy, toAppend) => {
    const toRemove = [];
    const toKeep = [];

    list.current.concat(toAppend).forEach((item) => {
      if (policy(item)) {
        toRemove.push(item);
      } else {
        toKeep.push(item);
      }
    });

    toRemove.map(excisor);
    list.current = toKeep;
  };
}

