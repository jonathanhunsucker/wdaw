import React, { useRef, useEffect } from "react";

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

export function Checkbox(props) {
  const { value, onChange, ...remainder } = props;

  const checkboxRef = useRef(null);

  const indeterminate = props.value === 'indeterminate';
  const checked = props.value === true || indeterminate;

  useEffect(() => {
    checkboxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);


  const inputProps = {};
  inputProps.type = 'checkbox';
  inputProps.ref = checkboxRef;
  inputProps.checked = checked;

  if (props.hasOwnProperty('onChange')) {
    inputProps.onChange = (e) => {
      const shiftWasPressed = e.nativeEvent.shiftKey;
      const isChecked = e.target.checked;

      const value = {
        [[true, true].toString()]: 'indeterminate',
        [['indeterminate', true].toString()]: false,
        [[false, true].toString()]: 'indeterminate',
        [[true, false].toString()]: false,
        [['indeterminate', false].toString()]: false,
        [[false, false].toString()]: true,
      }[[props.value, shiftWasPressed].toString()];

      props.onChange(value);
    };
  } else {
    inputProps.readOnly = true;
  }

  return (<input {...inputProps}/>);
}
