import React, { useEffect, useRef } from "react";


const Checkbox = React.memo(function Checkbox(props) {
  const checkboxRef = useRef(null);

  const indeterminate = props.value === 'indeterminate';
  const checked = props.value === true || indeterminate;

  useEffect(() => {
    checkboxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (e) => {
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

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
    />
  );
});

export default Checkbox;
