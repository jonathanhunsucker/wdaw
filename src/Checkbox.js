import React, { useEffect, useRef } from "react";


const Checkbox = React.memo(function Checkbox(props) {
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
});

export default Checkbox;
