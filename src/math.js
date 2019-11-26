import { Matcher, assert, anInteger } from "./types.js";

export function range(low, high) {
  let range = [];
  let current = low;
  while (current <= high) {
    range.push(current);
    current++;
  }

  return range;
}

export function flatten(lists) {
  if (Array.isArray(lists) === false) {
    return lists;
  }

  return lists.reduce((accumulation, list) => accumulation.concat(flatten(list)), []);
}

export function scaleUp(list, factor) {
  return list.map((item) => item * factor);
}

export function scaleDown(list, factor) {
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

export function reduceRational(rational) {
  assert(rational, aRational());

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

export function rationalAsFloat(rational) {
  assert(rational, aRational());

  if (rationalIsZero(rational)) {
    return 0;
  }

  return rational[0] / rational[1];
}

export function rationalIsZero(rational) {
  assert(rational, aRational());

  return rational[0] === 0 && rational[1] === 0;
}

export function rationalSum(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  if (rationalIsZero(left)) {
    return right;
  } else if (rationalIsZero(right)) {
    return left;
  }

  return reduceRational([left[0] * right[1] + right[0] * left[1], left[1] * right[1]]);
}

export function rationalDifference(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  if (rationalGreaterEqual(left, right) === false) {
    throw new Error('not subtracting larger rational from smaller');
  }

  if (rationalIsZero(right)) {
    return left;
  }

  return reduceRational([
    left[0] * right[1] - right[0] * left[1],
    left[1] * right[1],
  ]);
}

export function rationalGreaterEqual(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] >= left[1] * right[0];
}

export function rationalLessEqual(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] <= left[1] * right[0];
}

export function rationalGreater(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] > left[1] * right[0];
}

export function rationalLess(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  return left[0] * right[1] < left[1] * right[0];
}

export function rationalToMixed(rational) {
  assert(rational, aRational());

  if (rationalIsZero(rational)) {
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

export function rationalEquals(left, right) {
  assert(left, aRational());
  assert(right, aRational());

  if (left[0] === 0 || right[0] === 0) {
    return rationalIsZero(left) && rationalIsZero(right);
  }

  return left[0] * right[1] === left[1] * right[0];
}
