export class Mapping {
  constructor(mapping) {
    this.mapping = mapping;
  }
  contains(code) {
    return this.mapping.hasOwnProperty(code);
  }
  label(code) {
    if (this.contains(code) === false) {
      return "";
    }

    return this.mapping[code].label;
  }
  onPress(code) {
    if (this.contains(code) === false) {
      return () => {};
    }

    return this.mapping[code].onPress();
  }
}

export class Handler {
  constructor(label, onPress) {
    this.label = label;
    this.onPress = onPress;
  }
}
