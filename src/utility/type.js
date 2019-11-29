export function assert(value, matcher) {
  matcher.enforce(value);
};

export function enforce(value, matcher) {
  if (matcher.matches(value)) return;
  throw new TypeError();
}

export class Matcher {
  constructor(predicate) {
    this.predicate = predicate;
  }
  matches(value) {
    return this.predicate(value);
  }
  enforce(value) {
    if (this.matches(value)) return;
    debugger;
  }
}

export function notUndefined() {
  return new Matcher((value) => value !== undefined);
};

export function notNull() {
  return new Matcher((value) => value !== null);
};

export function notNaN() {
  return new Matcher((value) => !Number.isNaN(value));
};

export function instanceOf(cls) {
  notUndefined().enforce(cls);
  notNull().enforce(cls);
  return new Matcher((value) => {
    notUndefined().enforce(value);
    notNull().enforce(value);
    return value.constructor === cls;
  });
};

export function anInteger() {
  return new Matcher((value) => Number.isInteger(value));
};

export function aNonNegativeInteger() {
  return new Matcher((value) => {
    notNaN().enforce(value);
    return !(value < 0);
  });
};

export function aString() {
  return new Matcher((value) => typeof value === 'string');
};

export function anObject() {
  return new Matcher((value) => value instanceof Object);
};

export function is(expectedValue) {
  return new Matcher((value) => value === expectedValue);
};

export function anArray() {
  return new Matcher((value) => value instanceof Array);
};

export function any(matchers) {
  return new Matcher((value) => {
    return matchers.reduce((accumulation, matcher) => accumulation || matcher.matches(value), false);
  });
};

export function aMappingOf(keyMatcher, valueMatcher) {
  return new Matcher((object) => {
    anObject().enforce(object);
    for (var key in object) {
      if (!object.hasOwnProperty(key)) {
        return false;
      }

      keyMatcher.enforce(key);
      valueMatcher.enforce(object[key]);
    }

    return true;
  });
};

export function anArrayOf(valueMatcher) {
  return new Matcher((value) => {
    anArray().enforce(value);
    value.forEach((item) => valueMatcher.enforce(item));
    return true;
  });
};
