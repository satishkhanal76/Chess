import GameValidator from "./GameValidator.js";

export default class ThreeFoldRepitionValidator extends GameValidator {
  #gamePositions;
  constructor(game) {
    super(GameValidator.TYPES.DRAW_BY_REPITION, game);

    this.#gamePositions = [];
  }

  onPieceMove(command) {
    const currentPosition = this.getGame().getBoard().getPositionAsString();
    this.#gamePositions.push(currentPosition);
  }

  validate() {
    const currentPosition = this.#gamePositions[this.#gamePositions.length - 1];
    const occurrences = this.#gamePositions.filter(
      (pos) => pos.localeCompare(currentPosition) === 0
    );

    if (occurrences.length >= 3) {
      this.setIsOver(true);
    }
  }
}
