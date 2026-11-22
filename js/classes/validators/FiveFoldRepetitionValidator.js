import GameValidator from "./GameValidator.js";

export default class FiveFoldRepetitionValidator extends GameValidator {
  constructor(game) {
    super(GameValidator.TYPES.DRAW_BY_FIVEFOLD_REPETITION, game);
  }

  validate() {
    const game = this.getGame();
    this.setIsOver(game.getPositionHistory().count(game.getPositionKey()) >= 5);
  }
}
