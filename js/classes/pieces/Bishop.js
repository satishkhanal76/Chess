import { Movement } from "./Movement.js";
import { Piece } from "./Piece.js";

export class Bishop extends Piece {
  constructor(piece, colour) {
    super(piece.type, piece.character, colour, piece.FEN);
    this.configureMoves();
  }

  configureMoves() {
    this.addMoves(Movement.getDiagnolToTopLeft);
    this.addMoves(Movement.getDiagnolToTopRight);
    this.addMoves(Movement.getDiagnolToBottomLeft);
    this.addMoves(Movement.getDiagnolToBottomRight);
  }
}
