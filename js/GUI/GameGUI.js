import { BoardGUI } from "./BoardGUI";

export default class GameGUI {
  #game;
  #boardGUI;

  constructor(game) {
    this.#game = game;
  }
}
