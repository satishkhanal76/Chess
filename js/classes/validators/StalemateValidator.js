import GameValidator from "./GameValidator.js";

export default class StalemateValidator extends GameValidator {
  constructor(game) {
    super(GameValidator.TYPES.DRAW_BY_STALEMATE, game);
  }

  validate() {
    this.setIsOver(false);

    const currentPlayer = this.getGame().getCurrentPlayer();
    const board = this.getGame().getBoard();

    const isKingInCheck = board.isKingInCheck(currentPlayer.getColour());

    if (isKingInCheck) return;

    const allValidPlayerMoves = board.getAllValidMoves(
      currentPlayer.getColour()
    );

    if (allValidPlayerMoves.length <= 0) this.setIsOver(true);
  }
}
