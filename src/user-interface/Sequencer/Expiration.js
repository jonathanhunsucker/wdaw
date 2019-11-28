/**
 * Represents a pending time where upon the given binding should be released
 */
export default class Expiration {
  /**
   * @param {Binding} binding
   * @param {float} expiresOn
   */
  constructor(binding, expiresOn) {
    this.binding = binding;
    this.expiresOn = expiresOn;
  }
  expiresBy(moment) {
    const doesExpire = moment > this.expiresOn;
    return doesExpire;
  }
  expire() {
    this.binding.release();
  }
}

/**
 * Set of policies for expiring a list of Expirations
 */
export const policy = {
  all: () => {
    return (expiration) => true;
  },
  expiredAfter: (time) => {
    return (expiration) => expiration.expiresBy(time);
  },
};
