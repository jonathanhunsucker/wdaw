export default class Sequencer {
  constructor(count) {
    this.count = count;
  }
  setCount(count) {
    return new Sequencer(count);
  }
};
