import { assert, instanceOf, aString, aMappingOf } from "@/utility/type.js";

export class Mapping {
  constructor(mapping) {
    assert(mapping, aMappingOf(aString(), instanceOf(Handler)));
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
