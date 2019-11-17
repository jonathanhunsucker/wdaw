
export function Seconds(value) {
  return value.toFixed(3) + "s";
}

export function Percentage(value) {
  return Math.round(value.toFixed(2) * 100) + "%";
}

export function Frequency(value) {
  var scale = "";

  if (value >= 1000) {
    value /= 1000;
    scale = "k";
  }

  return `${value.toFixed(3)} ${scale}Hz`;
}

