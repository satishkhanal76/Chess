import GameValidator from "./GameValidator.js";
import { Piece } from "../pieces/Piece.js";

export default class DeadPositionValidator extends GameValidator {
  constructor(game) {
    super(GameValidator.TYPES.DRAW_BY_DEADPOSITION, game);
  }

  validate() {
    this.setIsOver(false);

    const board = this.getGame().getBoard();
    const pieces = board.getAllPieces();
    const nonKingPieces = pieces.filter(
      (piece) => piece.getType() !== Piece.TYPE.KING
    );

    // King vs King
    if (nonKingPieces.length === 0) {
      this.setIsOver(true);
      return;
    }

    // King + minor piece vs King
    if (nonKingPieces.length === 1) {
      const pieceType = nonKingPieces[0].getType();

      if (
        pieceType === Piece.TYPE.BISHOP ||
        pieceType === Piece.TYPE.KNIGHT
      ) {
        this.setIsOver(true);
      }

      return;
    }

    // Only continue for two remaining non-king pieces
    if (nonKingPieces.length !== 2) return;

    const [firstPiece, secondPiece] = nonKingPieces;

    // Only bishops can create a same-color bishop dead position
    if (
      firstPiece.getType() !== Piece.TYPE.BISHOP ||
      secondPiece.getType() !== Piece.TYPE.BISHOP
    ) {
      return;
    }

    const firstPosition = board.getPiecePosition(firstPiece);
    const secondPosition = board.getPiecePosition(secondPiece);

    const firstSquareColor = (firstPosition.getFile() + firstPosition.getRank()) % 2;
    const secondSquareColor = (secondPosition.getFile() + secondPosition.getRank()) % 2;

    // King + Bishop vs King + Bishop on same-colored squares
    if (firstSquareColor === secondSquareColor) {
      this.setIsOver(true);
    }
  }
}
