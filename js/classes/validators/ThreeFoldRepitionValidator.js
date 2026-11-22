import GameValidator from "./GameValidator.js";

export default class ThreeFoldRepitionValidator extends GameValidator {
  constructor(game) {
    super(GameValidator.TYPES.DRAW_BY_REPITION, game);
  }

  validate() {
    this.setIsOver(false);
  }

  isClaimable() {
    const game = this.getGame();
    return game.getPositionHistory().count(game.getPositionKey()) >= 3;
  }
}
