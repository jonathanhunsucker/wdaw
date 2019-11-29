import { useState, useRef } from "react";

export default function useSelectionState(source, optionsProvider) {
  const [internalItemId, setItemId] = useState(null);
  const options = optionsProvider(source);
  const itemId = internalItemId !== null && options.hasOwnProperty(internalItemId) ? internalItemId : (options.length > 0 ? options[0] : null);

  const setSelection = (newItemId) => {
    setItemId(newItemId);
  };

  return [
    itemId,
    setSelection,
  ];
};
