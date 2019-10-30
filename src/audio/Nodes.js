import Note from "../music/Note.js";

/**
 * Some browsers gate audio until the user interacts with the page.
 *
 * One strategy for "opening" this browser-internal gate, is to play
 * a sound on an audio context, from within the handler for an event
 * induced by an intentional (ie. not scrolling) interaction with the
 * page.
 *
 * This method exists to be a quick gate-opening method.
 */
export function silentPingToWakeAutoPlayGates(audioContext) {
  const binding = new Binding(
    new Gain(0.0),
    null,
    [
      new Binding(
        new Wave('triangle'),
        new Note('C4'),
        []
      ),
    ]
  );

  binding.play(audioContext, audioContext.destination);
}

export function stageFactory(stageObject) {
  const registry = [Wave, Envelope, Gain].reduce((reduction, stage) => {
    reduction[stage.kind] = stage;
    return reduction;
  }, {});

  return registry[stageObject.kind].parse(stageObject);
}

/*
 * Partial application of a note to tree of stages
 */
export class Binding {
  constructor(stage, note, bindings) {
    this.stage = stage;
    this.note = note;
    this.bindings = bindings;
  }
  /*
   * Actually builds nodes, then starts and connects
   */
  play(audioContext, destination) {
    const node = this.stage.press(audioContext, this.note);
    node.connect(destination);
    this.bindings.forEach((binding) => binding.play(audioContext, node).connect(node));
    return node;
  }
}

export class Wave {
  constructor(type) {
    this.type = type;
  }
  static parse(object) {
    return new Wave(object.type);
  }
  bind(note) {
    return new Binding(
      this,
      note,
      []
    );
  }
  press(audioContext, note) {
    const wave = audioContext.createOscillator();

    wave.type = this.type;
    wave.frequency.value = note.frequency;
    wave.start(wave.context.currentTime);

    return wave;
  }
  release(node) {
    node.stop(node.context.currentTime + 1.0);
  }
  toJSON() {
    return {
      kind: Wave.kind,
      type: this.type,
    };
  }
}
Wave.kind = "wave";

export class Gain {
  constructor(level, upstreams) {
    this.level = level;
    this.upstreams = upstreams;
  }
  static parse(object) {
    return new Gain(object.level, (object.upstreams || []).map(stageFactory));
  }
  bind(note) {
    return new Binding(
      this,
      note,
      this.upstreams.map((stage) => stage.bind(note))
    );
  }
  press(audioContext) {
    const gain = audioContext.createGain();
    gain.gain.value = this.level;

    return gain;
  }
  release(node) {
  }
  toJSON() {
    return {
      kind: Gain.kind,
      level: this.level,
      upstreams: this.upstreams,
    };
  }
}
Gain.kind = "gain";

export class Envelope {
  constructor(options, upstreams) {
    this.options = {
      attack: options.attack || 0.001,
      decay: options.decay || 0.0,
      sustain: options.sustain || 1.0,
      release: options.release || 0.5,
    };

    this.upstreams = upstreams;
  }
  static parse(object) {
    return new Envelope({
      attack: object.attack,
      decay: object.decay,
      sustain: object.sustain,
      release: object.release,
    }, object.upstreams.map(stageFactory));
  }
  bind(note) {
    return new Binding(
      this,
      note,
      this.upstreams.map((stage) => stage.bind(note))
    );
  }
  press(audioContext, note) {
    const node = audioContext.createGain();
    const now = node.context.currentTime;

    node.gain.setValueAtTime(0.0, now + 0.0); // initialize to 0
    node.gain.linearRampToValueAtTime(1.0, now + this.options.attack); // attack
    node.gain.linearRampToValueAtTime(this.options.sustain, now + this.options.attack + this.options.decay); // decay to sustain

    return node;
  }
  release(node) {
    node.gain.linearRampToValueAtTime(0, node.context.currentTime + this.options.release);
  }
  toJSON() {
    return {
      kind: Envelope.kind,
      attack: this.attack,
      decay: this.decay,
      sustain: this.sustain,
      release: this.release,
      upstreams: this.upstreams,
    };
  }
}
Envelope.kind = "envelope";
