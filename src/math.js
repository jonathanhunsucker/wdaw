export function range(low, high) {
  let range = [];
  let current = low;
  while (current <= high) {
    range.push(current);
    current++;
  }

  return range;
}

export function modulo(x, mod) {
  let value = x % mod;
  if (value < 0) {
    value += mod;
  }

  return value;
}
