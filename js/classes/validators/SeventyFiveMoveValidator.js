import GameValidator from "./GameValidator.js";

export default class SeventyFiveMoveValidator extends GameValidator {
  constructor(game) {
    super(GameValidator.TYPES.DRAW_BY_SEVENTY_FIVE_MOVE, game);
  }

  validate() {
    this.setIsOver(this.getGame().getHalfmoveClock() >= 150);
  }
}
