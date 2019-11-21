import React from "react";

export function ScaledInput({ base, value, min, max, onChange }) {
  const scale = (value) => Math.pow(value, base);
  const unscale = (value) => Math.pow(value, 1 / base);

  return (
    <input
      type="range"
      style={{verticalAlign: "middle"}}
      value={unscale(value)}
      min={unscale(min)}
      step={0.01}
      max={unscale(max)}
      onChange={(e) => onChange(scale(e.target.valueAsNumber))}
    />
  );
}

export function CubicScalePositiveInput(props) {
  return (<ScaledInput base={3} min={1} {...props} />);
}

export function CubicScaleUnitInput(props) {
  return (<ScaledInput base={3} min={0} max={1} {...props} />);
}

export function LinearScaleUnitInput(props) {
  return (<ScaledInput base={1} min={0} max={1} {...props} />);
}
