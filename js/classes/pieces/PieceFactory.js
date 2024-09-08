import { King } from "./King.js";
import { Queen } from "./Queen.js";
import { Rook } from "./Rook.js";
import { Bishop } from "./Bishop.js";
import { Knight } from "./Knight.js";
import { Pawn } from "./Pawn.js";

import { Piece } from "./Piece.js";

export const PIECE_DATA = {
  [Piece.COLOUR.BLACK]: [
    {
      type: Piece.TYPE.KING,
      character: "♚",
      class: King,
      FEN: "k",
      canBePromotedTo: false,
    },
    {
      type: Piece.TYPE.QUEEN,
      character: "♛",
      class: Queen,
      FEN: "q",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.ROOK,
      character: "♜",
      class: Rook,
      FEN: "r",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.BISHOP,
      character: "♝",
      class: Bishop,
      FEN: "b",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.KNIGHT,
      character: "♞",
      class: Knight,
      FEN: "n",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.PAWN,
      character: "♟︎",
      class: Pawn,
      FEN: "p",
      promotionRow: 7,
      canBePromotedTo: false,
    },
  ],
  [Piece.COLOUR.WHITE]: [
    {
      type: Piece.TYPE.KING,
      character: "♔",
      class: King,
      FEN: "K",
      canBePromotedTo: false,
    },
    {
      type: Piece.TYPE.QUEEN,
      character: "♕",
      class: Queen,
      FEN: "Q",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.ROOK,
      character: "♖",
      class: Rook,
      FEN: "R",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.BISHOP,
      character: "♗",
      class: Bishop,
      FEN: "B",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.KNIGHT,
      character: "♘",
      class: Knight,
      FEN: "N",
      canBePromotedTo: true,
    },
    {
      type: Piece.TYPE.PAWN,
      character: "♙",
      class: Pawn,
      FEN: "P",
      promotionRow: 0,
      canBePromotedTo: false,
    },
  ],
};

export class PieceFactory {
  static getPiece(pieceType, colour) {
    for (let i = 0; i < PIECE_DATA[colour].length; i++) {
      let piece = PIECE_DATA[colour][i];
      if (piece.type == pieceType) {
        return new piece.class(piece, colour);
      }
    }
  }

  static getPieceFen(fenCharacter) {
    let colour = Piece.COLOUR.WHITE;

    for (let i = 0; i < PIECE_DATA[colour].length; i++) {
      let piece = PIECE_DATA[colour][i];
      if (piece.FEN == fenCharacter) {
        return new piece.class(piece, colour);
      }
    }

    colour = Piece.COLOUR.BLACK;

    for (let i = 0; i < PIECE_DATA[colour].length; i++) {
      let piece = PIECE_DATA[colour][i];
      if (piece.FEN == fenCharacter) {
        return new piece.class(piece, colour);
      }
    }
    return null;
  }
}
