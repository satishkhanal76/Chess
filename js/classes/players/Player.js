
import { Piece } from "../pieces/Piece.js";

export class Player {
  #board;

  #color;
  #pieces;

  #takenPieces;

  constructor(board, color) {
    this.#board = board;

    this.#color = color;
    this.#pieces = [];
    this.#takenPieces = [];

    this.getPieces();
  }
  
  getValidMoves(piece) {
    if (piece.getColour() !== this.getColour()) return [];

    return this.#board.getValidMoves(piece);
  }

  isInCheck() {
    return this.#board.isKingInCheck(this.getColour());
  }

  isInCheckMate() {
    return this.#board.isInCheckmate(this.getColour());
  }

  isInStaleMate() {
    return false;
  }
  /**
   * Finds and returns the king
   * @returns
   */
  findKing() {
    return this.findPiece(Piece.TYPE.KING);
  }

  /**
   * Finds returns the first piece that matches the type
   * @param {*} pieceType
   * @returns
   */
  findPiece(pieceType) {
    let pieces = this.findPieces(pieceType);
    if (pieces.length >= 1) return pieces[0];
    return null;
  }

  /**
   * Finds and returns all pieces that match the type
   */
  findPieces(pieceType) {
    this.getPieces();
    return this.#pieces.filter((piece) => piece.getType() === pieceType);
  }

  /**
   * Returns all pieces that are on the board that is of this player colour
   */
  getPieces() {
    this.#pieces = this.#board.getAllColouredPieces(this.#color);
    return this.#pieces;
  }

  getColour() {
    return this.#color;
  }

  getTakenPieces() {
    return this.#takenPieces;
  }
}
