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

export function flatten(lists) {
  return [].concat.apply([], lists);
}

export function scaleUp(list, factor) {
  return list.map((item) => item * factor);
}

export function scaleDown(list, factor) {
  return list.map((item) => item / factor);
}

export function reduceRational(rational) {
  if (rational[0] === 0) {
    return [0, 0];
  }
  const [numerator, denominator] = rational;
  return scaleDown(rational, greatestCommonDivisor(numerator, denominator));
}

export function greatestCommonDivisor(x, y) {
  if (!y) {
    return x;
  }

  return greatestCommonDivisor(y, x % y);
}

export function leastCommonMultiplier(x, y) {
  return (x + y) / greatestCommonDivisor(x, y);
}

export function rationalIsZero(rational) {
  return rational[0] === 0 && rational[1] === 0;
}

export function rationalSum(left, right) {
  if (rationalIsZero(left)) {
    return right;
  } else if (rationalIsZero(right)) {
    return left;
  }

  return reduceRational([left[0] * right[1] + right[0] * left[1], left[1] * right[1]]);
}

export function rationalGreaterEqual(left, right) {
  return left[0] * right[1] >= left[1] * right[0];
}

export function rationalEquals(left, right) {
  if (left[0] === 0 || right[0] === 0) {
    return rationalIsZero(left) && rationalIsZero(right);
  }

  return left[0] * right[1] === left[1] * right[0];
}
