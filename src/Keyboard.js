import React, { useRef, useState, useEffect } from "react";

const MARGIN = 0.1;

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

export function key(code, span) {
  return {
    code: code,
    span: span || 1,
  };
}

export function offset(span) {
  return key(null, span);
}

function square(maxWidth, mapping, pressed, onPress, onRelease, key) {
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
        minWidth: `${width}vw`,
        lineHeight: `${basis}vw`,
        minHeight: `${basis}vw`,
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

function max(accumulator, item) {
  return Math.max(accumulator, item);
}

function sum(accumulator, item) {
  return accumulator + item;
}

export function Keyboard(props) {
  const maxWidth = props.layout
    .map((row) => row.map((item) => item.span).reduce(sum, 0) + row.length * MARGIN)
    .reduce(max, 0);

  return (
    <div>
      {props.layout.map((row, i) => {
        return (
          <div key={i} style={{overflow: "auto", with: "100%"}}>
            {row.map((item, j) => {
              return square(maxWidth, props.mapping, props.pressed, props.onPress, props.onRelease, item);
            })}
          </div>
        );
      })}
    </div>
  );
}

