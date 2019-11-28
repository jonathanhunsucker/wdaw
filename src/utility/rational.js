import { Matcher, assert, anInteger } from "./type.js";

function scaleDown(list, factor) {
  return list.map((item) => item / factor);
}

export function aRational() {
  return new Matcher((value) => {
    return Array.isArray(value)
      && value.length === 2
      && anInteger().matches(value[0])
      && anInteger().matches(value[1]);
  });
}

export function reduce(rational) {
  assert(rational, aRational());

  if (rational[0] === 0) {
    return [0, 0];
  }
  const [numerator, denominator] = rational;
  return scaleDown(rational, greatestCommonDivisor(numerator, denominator));
}

function greatestCommonDivisor(x, y) {
  if (!y) {
    return x;
  }

  return greatestCommonDivisor(y, x % y);
}

export function asFloat(rational) {
  assert(rational, aRational());

  if (isZero(rational)) {
    return 0;
  }

  return rational[0] / rational[1];
}

export function isZero(rational) {
  assert(rational, aRational());

  return rational[0] === 0 && rational[1] === 0;
}

export function sum(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  if (isZero(left)) {
    return right;
  } else if (isZero(right)) {
    return left;
  }

  return reduce([left[0] * right[1] + right[0] * left[1], left[1] * right[1]]);
}

export function difference(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  if (greaterEqual(left, right) === false) {
    throw new Error('not subtracting larger rational from smaller');
  }

  if (isZero(right)) {
    return left;
  }

  return reduce([
    left[0] * right[1] - right[0] * left[1],
    left[1] * right[1],
  ]);
}

export function greaterEqual(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] >= left[1] * right[0];
}

export function lessEqual(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] <= left[1] * right[0];
}

export function greater(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] > left[1] * right[0];
}

export function less(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] < left[1] * right[0];
}

export function toMixed(rational) {
  assert(rational, aRational());

  if (isZero(rational)) {
    return [0, [0, 0]];
  }

  const [numerator, denominator] = rational;
  const integer = Math.floor(numerator / denominator);
  const remainder = [numerator % denominator, denominator];

  return [
    integer,
    remainder,
  ];
}

export function equals(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  if (left[0] === 0 || right[0] === 0) {
    return isZero(left) && isZero(right);
  }

  return left[0] * right[1] === left[1] * right[0];
}
