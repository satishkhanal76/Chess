import FileRankFactory from "../FileRankFactory.js";
import { Movement } from "./Movement.js";
import { Piece } from "./Piece.js";

export class Knight extends Piece {
  constructor(piece, colour) {
    super(piece.type, piece.character, colour, piece.FEN);
    this.configureMoves();
  }

  configureMoves() {
    this.addMoves(Movement.getKnightMovement);
  }

  checkPathForValidSpots(board, spots) {
    for (let i = spots.length - 1; i >= 0; i--) {
      let spot = spots[i];
      let pieceAtTheSpot = board.getPiece(
        FileRankFactory.getFileRank(spot.col, spot.row)
      );

      if (!pieceAtTheSpot) continue;

      if (pieceAtTheSpot.getColour() == this.getColour()) spots.splice(i, 1);
    }
    return spots;
  }
}
