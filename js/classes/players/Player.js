export class Player {
  #color;
  constructor(color) {
    this.#color = color;

  }
  getColour() {
    return this.#color;
  }
}
