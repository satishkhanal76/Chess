export default class ChessClock {
  #remaining;
  #increment;
  #activeColour = null;
  #startedAt = null;
  #timer = null;
  #onFlag;
  #listeners = new Set();

  constructor({ initialTimeMs = 300000, incrementMs = 0, onFlag = () => {} } = {}) {
    if (!Number.isFinite(initialTimeMs) || initialTimeMs <= 0) throw new RangeError("Initial clock time must be positive.");
    if (!Number.isFinite(incrementMs) || incrementMs < 0) throw new RangeError("Clock increment cannot be negative.");
    this.#remaining = { white: initialTimeMs, black: initialTimeMs };
    this.#increment = incrementMs;
    this.#onFlag = onFlag;
  }

  start(colour) {
    if (this.#startedAt !== null) return;
    this.#activate(colour);
  }

  switchTurn(nextColour) {
    if (this.#startedAt === null) return;
    const previousColour = this.#activeColour;
    this.#settle(previousColour);
    if (this.#remaining[previousColour] <= 0) {
      this.#flag(previousColour);
      return;
    }
    this.#remaining[previousColour] += this.#increment;
    this.#activate(nextColour);
  }

  pause() {
    if (this.#startedAt === null) return;
    this.#settle(this.#activeColour);
    this.#clearTimer();
    this.#startedAt = null;
    this.#activeColour = null;
    this.#emit();
  }

  resume(colour) {
    this.start(colour);
  }

  stop() {
    this.pause();
  }

  getRemaining(colour) {
    const time = this.#remaining[colour];
    if (this.#activeColour !== colour || this.#startedAt === null) return Math.max(0, time);
    return Math.max(0, time - (this.#now() - this.#startedAt));
  }

  getState() {
    return {
      white: this.getRemaining("white"),
      black: this.getRemaining("black"),
      activeColour: this.#activeColour,
    };
  }

  setOnFlag(callback) {
    this.#onFlag = typeof callback === "function" ? callback : () => {};
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #activate(colour) {
    if (colour !== "white" && colour !== "black") throw new Error("Clock colour must be white or black.");
    this.#activeColour = colour;
    this.#startedAt = this.#now();
    this.#timer = setInterval(() => {
      this.#emit();
      if (this.getRemaining(colour) <= 0) this.#flag(colour);
    }, 100);
    this.#timer.unref?.();
    this.#emit();
  }

  #settle(colour) {
    if (this.#startedAt === null) return;
    this.#remaining[colour] = Math.max(0, this.getRemaining(colour));
    this.#startedAt = null;
  }

  #flag(colour) {
    this.#settle(colour);
    this.#clearTimer();
    this.#activeColour = null;
    this.#onFlag(colour);
    this.#emit();
  }

  #clearTimer() {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
  }

  #emit() {
    const state = this.getState();
    for (const listener of this.#listeners) listener(state);
  }

  #now() {
    return globalThis.performance?.now?.() ?? Date.now();
  }
}
