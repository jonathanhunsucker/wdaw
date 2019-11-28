import React from "react";

export const MARGIN = 0.1;

function codeToColor(mapping, pressed, code) {
  if (code === null) {
    return "transparent";
  }

  if (mapping.contains(code) === false) {
    return "lightgrey";
  }

  if (pressed.indexOf(code) === -1) {
    return "grey";
  }

  return "black";
}

function label(mapping, pressed, code) {
  if (mapping.contains(code) === false) {
    return "";
  }

  if (pressed.indexOf(code) === -1) {
    return mapping.label(code);
  }

  return <b>{mapping.label(code)}</b>;
}

export default function square(maxWidth, mapping, pressed, onPress, onRelease, key) {
  const basis = 100.0 / maxWidth;
  const width = key.span * basis;

  const onPointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    onPress(key.code);
  };

  const onPointerUp = (e) => {
    onRelease(key.code);
  };

  const onPointerCancel = (e) => {
    onRelease(key.code);
  };

  return (
    <div
      key={key.code}
      style={{
        background: codeToColor(mapping, pressed, key.code),
        float: "left",
        color: "white",
        display: "inline-block",
        fontSize: `${basis/2}vw`,
        width: `${width}vw`,
        lineHeight: `${basis}vw`,
        height: `${basis}vw`,
        margin: `${MARGIN}vw`,
        textAlign: "center",
        verticalAlign: "middle",
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      >
      {label(mapping, pressed, key.code)}
    </div>
  );
}
