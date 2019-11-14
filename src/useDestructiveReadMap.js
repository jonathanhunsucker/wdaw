import { useRef } from "react";

export default function useDestructiveReadMap() {
  const map = useRef([]);

  const put = (key, value) => {
    map.current = ((m) => {
      const update = {};
      update[key] = m.hasOwnProperty(key) ? m[key].concat([value]) : [value];
      const withUpdate = Object.assign({}, m, update);
      return withUpdate;
    })(map.current);
  };

  const read = (key) => {
    var value;

    map.current = ((m) => {
      const entries = m[key] || [];
      value = entries[0];
      const remaining = entries.slice(1);
      const withoutKey = Object.assign({}, m);

      if (remaining.length >= 1) {
        withoutKey[key] = remaining;
      } else {
        delete withoutKey[key];
      }

      return withoutKey;
    })(map.current);

    return value;
  };

  return [
    put,
    read,
  ];
}
