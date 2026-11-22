export default class PositionHistory {
  #positions = [];

  record(positionKey) {
    this.#positions.push(positionKey);
  }

  count(positionKey) {
    return this.#positions.reduce((total, position) => total + (position === positionKey ? 1 : 0), 0);
  }

  snapshot() {
    return [...this.#positions];
  }

  restore(positions) {
    this.#positions = [...positions];
  }
}
