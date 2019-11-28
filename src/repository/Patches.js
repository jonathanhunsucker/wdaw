import { Envelope, Wave, Filter, Noise } from "@jonathanhunsucker/audio-js";

export const synth = () => {
  return new Filter(
    "lowpass",
    1000,
    1,
    null,
    [
      new Envelope(
        {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.2,
          release: 0.5,
        },
        [
          new Wave('triangle'),
        ],
      ),
    ]
  );
};

export const hat = () => {
  return new Filter(
    "bandpass",
    12000,
    1,
    null,
    [
      new Envelope(
        {
          attack: 0.001,
          decay: 0.050,
          sustain: 0,
          release: 0.050,
        },
        [
          new Noise(),
        ]
      ),
    ]
  );
};

export const snare = () => {
  return new Filter(
    "bandpass",
    5000,
    1,
    null,
    [
      new Envelope(
        {
          attack: 0.001,
          decay: 0.050,
          sustain: 0,
          release: 0.050,
        },
        [
          new Noise(),
        ]
      ),
    ]
  );
};
