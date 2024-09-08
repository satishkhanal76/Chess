export default class GameValidator {
  static TYPES = {
    CHECKMATE: "WIN_BY_CHECKMATE",
    DRAW_BY_STALEMATE: "DRAW_BY_STALEMATE",
    DRAW_BY_DEADPOSITION: "DRAW_BY_DEADPOSITION",
    DRAW_BY_REPITION: "DRAW_BY_REPITION",
  };

  #isOver;
  #winner;

  #type;

  #game;

  constructor(type, game) {
    this.#type = type;
    this.#game = game;
  }

  validate() {
    throw new Error("Not Implemented");
  }

  onPieceMove(command) {}

  getType() {
    return this.#type;
  }

  setIsOver(isOver) {
    this.#isOver = isOver;
  }

  getIsOver() {
    return this.#isOver;
  }

  setWinner(winner) {
    this.#winner = winner;
  }

  getWinner() {
    return this.#winner;
  }

  getGame() {
    return this.#game;
  }
}
