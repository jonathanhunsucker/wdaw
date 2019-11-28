export function zip(accumulation, entry) {
  if (!accumulation) {
    accumulation = {};
  }

  accumulation[entry[0]] = entry[1];
  return accumulation;
}

export function unique(item, index, list) {
  return list.indexOf(item) === index;
};

export function repackObject(object) {
  return {
    replaceValue: (before, after) => {
      return Object.entries(object).map(([key, value]) => [key, value === before ? after : value]).reduce(zip, {});
    },
  };
}

export function repackArray(array) {
  return {
    replaceItem: (before, after) => {
      return array.map((item) => item === before ? after : item);
    },
  };
}

export function memo(that, property, getter) {
  if (that.hasOwnProperty(property) === false) {
    that[property] = getter();
  }

  return that[property];
}
