// will walk and talk like a note, but for representing percusive notes instead of scientific pitch notation
// eventually, should be rolled back into music-js
export default class Percussion {
  constructor(pitch) {
    this.pitch = pitch;
  }
  equals(percussion) {
    return this.pitch === percussion.pitch;
  }
}
