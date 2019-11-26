export function assert(value, matcher) {
  matcher.enforce(value);
};

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

export function instanceOf(cls) {
  return new Matcher((value) => {
    notUndefined().enforce(value);
    notNull().enforce(value);
    return value.constructor === cls;
  });
};

export function anInteger() {
  return new Matcher((value) => Number.isInteger(value));
};

export function aString() {
  return new Matcher((value) => typeof value === 'string');
};

export function any(matchers) {
  return new Matcher((value) => {
    return matchers.reduce((accumulation, matcher) => accumulation || matcher.matches(value), false);
  });
};
