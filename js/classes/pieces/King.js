import { Movement } from "./Movement.js";
import { Piece } from "./Piece.js";

export class King extends Piece {
  constructor(piece, colour) {
    super(piece.type, piece.character, colour, piece.FEN);
    this.configureMoves();
  }

  configureMoves() {
    this.addMoves(Movement.getForwardToTop);
    this.addMoves(Movement.getForwardToBottom);
    this.addMoves(Movement.getForwardToLeft);
    this.addMoves(Movement.getForwardToRight);
    this.addMoves(Movement.getOneDiagnolToTopLeft);
    this.addMoves(Movement.getOneDiagnolToTopRight);
    this.addMoves(Movement.getOneDiagnolToBottomLeft);
    this.addMoves(Movement.getOneDiagnolToBottomRight);
  }
}
