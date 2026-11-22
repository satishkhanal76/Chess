export default class GameValidator {
  static TYPES = {
    CHECKMATE: "WIN_BY_CHECKMATE",
    DRAW_BY_STALEMATE: "DRAW_BY_STALEMATE",
    DRAW_BY_DEADPOSITION: "DRAW_BY_DEADPOSITION",
    DRAW_BY_REPITION: "DRAW_BY_REPITION",
    DRAW_BY_FIVEFOLD_REPETITION: "DRAW_BY_FIVEFOLD_REPETITION",
    DRAW_BY_SEVENTY_FIVE_MOVE: "DRAW_BY_SEVENTY_FIVE_MOVE",
    DRAW_BY_FIFTY_MOVE: "DRAW_BY_FIFTY_MOVE",
    DRAW_BY_AGREEMENT: "DRAW_BY_AGREEMENT",
    WIN_BY_RESIGNATION: "WIN_BY_RESIGNATION",
    WIN_BY_TIMEOUT: "WIN_BY_TIMEOUT",
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
