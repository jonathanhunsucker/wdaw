import { useState } from "react";

export default function useSet(initial) {
  const [set, setSet] = useState([]);

  const add = (item) => {
    setSet((s) => s.concat([item]));
  };

  const remove = (item) => {
    setSet((s) => s.filter((i) => i !== item));
  };

  return [set, add, remove];
}
