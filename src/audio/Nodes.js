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
  ping(audioContext, 20000, 0.0);
}


/**
 * Play a triangle wave at a frequency and gain, for a 300ms duration.
 *
 * @param {AudioContext} audioContext
 * @param {Number} frequency - In hertz, eg. 440
 * @param {Number} gainLevel - Between 0.0 and 1.0
 */
export function ping(audioContext, frequency, gainLevel) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  oscillator.start(oscillator.context.currentTime);
  oscillator.stop(oscillator.context.currentTime + 0.3);

  const gain = audioContext.createGain();
  gain.gain.value = gainLevel;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
}
