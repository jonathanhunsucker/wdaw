export function max(accumulator, item) {
  return Math.max(accumulator, item);
}

export function sum(accumulator, item) {
  return accumulator + item;
}

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
