import { useState } from "react";

export default function useSelectionState(source, optionsProvider) {
  const [itemId, setItemId] = useState(null);
  if (itemId === null && source.length > 0) {
    const options = optionsProvider(source);
    const defaultItemId = options.length > 0 ? options[0] : null;
    setItemId(defaultItemId);
  }

  const setSelection = (newItemId) => {
    setItemId(newItemId);
  };

  return [
    itemId,
    setSelection,
  ];
};
