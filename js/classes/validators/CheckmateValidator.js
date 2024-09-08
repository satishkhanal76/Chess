import GameValidator from "./GameValidator.js";

export default class CheckmateValidator extends GameValidator {
  constructor(game) {
    super(GameValidator.TYPES.CHECKMATE, game);
  }

  validate() {
    this.setIsOver(false);

    const players = this.getGame().getPlayers();
    const board = this.getGame().getBoard();

    // probably a good idea to implement board.isInCheckmate() logic here rather than calling it
    let leftPlayer = players.filter(
      (player) => !board.isInCheckmate(player.getColour())
    );

    this.setWinner(this.getGame().getCurrentPlayer());
    if (leftPlayer.length <= 1) this.setIsOver(true);
  }
}
