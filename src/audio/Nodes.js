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
  const voice = new Voice(
    [
      new Gain(
        0.0,
        [
          new Wave('triangle'),
        ]
      )
    ]
  );

  voice.play(audioContext, new Note('C4'));
}

function passthru(upstreams, audioContext, note, destination) {
  upstreams
    .map((upstream) => upstream.play(audioContext, note))
    .forEach((node) => node.connect(destination));
}


export class Voice {
  constructor(upstreams) {
    this.upstreams = upstreams || [];
  }
  play(audioContext, note) {
    passthru(this.upstreams, audioContext, note, audioContext.destination);
  }
}

export class Wave {
  constructor(type) {
    this.type = type;
  }
  play(audioContext, note) {
    const node = audioContext.createOscillator();

    node.type = this.type;
    node.frequency.value = note.frequency;
    node.start(node.context.currentTime);
    node.stop(node.context.currentTime + 0.3);

    return node;
  }
}

export class Gain {
  constructor(level, upstreams) {
    this.level = level;
    this.upstreams = upstreams;
  }
  play(audioContext, note) {
    const node = audioContext.createGain();
    node.gain.setValueAtTime(0.0, this.level);

    passthru(this.upstreams, audioContext, note, node);

    return node;
  }
}

export class Envelope {
  constructor(options, upstreams) {
    this.attack = options.attack || 0.0;
    this.decay = options.decay || 0.0;
    this.sustain = options.sustain || 0.0;
    this.release = options.release || 0.0;

    this.upstreams = upstreams;
  }
  static parse(object) {
    return new Envelope({}, []);
  }
  play(audioContext, note) {
    const node = audioContext.createGain();
    const now = node.context.currentTime;

    passthru(this.upstreams, audioContext, note, node);

    node.gain.setValueAtTime(0.0, now + 0.0); // initialize to 0
    node.gain.linearRampToValueAtTime(1.0, now + this.attack); // attack
    node.gain.linearRampToValueAtTime(this.sustain, now  + this.attack + this.decay); // decay to sustain

    return node;
  }
}
