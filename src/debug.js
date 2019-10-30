import React from "react";

export function DumpJson(object) {
  return (<pre>{JSON.stringify(object, null, 2)}</pre>);
}
