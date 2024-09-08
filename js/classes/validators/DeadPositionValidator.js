import GameValidator from "./GameValidator.js";

export default class DeadPositionValidator extends GameValidator {
  constructor(game) {
    super(GameValidator.TYPES.DRAW_BY_STALEMATE, game);
  }

  validate(game) {
    const players = game.getPlayers();
  }
}
