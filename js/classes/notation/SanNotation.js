import { Command } from "../commands/Command.js";
import { Piece } from "../pieces/Piece.js";

const SAN_LETTER = {
  [Piece.TYPE.KING]: "K",
  [Piece.TYPE.QUEEN]: "Q",
  [Piece.TYPE.ROOK]: "R",
  [Piece.TYPE.BISHOP]: "B",
  [Piece.TYPE.KNIGHT]: "N",
};

export default class SanNotation {
  static formatBeforeMove(board, command) {
    if (command.getType() === Command.TYPES.CASTLE_COMMAND) {
      return command.getRookPosition().getCol() > command.getKingPosition().getCol() ? "O-O" : "O-O-O";
    }

    const piece = command.getMovingPiece();
    const from = command.getFrom();
    const to = command.getTo();
    const destination = to.getFileRank();
    const isCapture = Boolean(command.getTakingPiece()) || command.getType() === Command.TYPES.EN_PASSANT_COMMAND;
    let prefix = SAN_LETTER[piece.getType()] || "";

    if (piece.getType() === Piece.TYPE.PAWN) {
      if (isCapture) prefix = from.getFile();
    } else {
      const alternatives = board.getAllColouredPieces(piece.getColour()).filter((other) =>
        other !== piece &&
        other.getType() === piece.getType() &&
        board.getValidMoves(other).some((move) => move.col === to.getCol() && move.row === to.getRow())
      );
      if (alternatives.length) {
        const sameFile = alternatives.some((other) => board.getPiecePosition(other).getFile() === from.getFile());
        const sameRank = alternatives.some((other) => board.getPiecePosition(other).getRank() === from.getRank());
        if (!sameFile) prefix += from.getFile();
        else if (!sameRank) prefix += from.getRank();
        else prefix += from.getFileRank();
      }
    }

    if (isCapture) prefix += "x";
    let san = `${prefix}${destination}`;
    if (command.getType() === Command.TYPES.PROMOTION_COMMAND) {
      san += `=${SAN_LETTER[command.getPromotionPiece().getType()]}`;
    }
    return san;
  }

  static addCheckSuffix(board, san, sideToMove) {
    const colour = sideToMove === "WHITE" ? Piece.COLOUR.BLACK : Piece.COLOUR.WHITE;
    if (!board.isKingInCheck(colour)) return san;
    return `${san}${board.isInCheckmate(colour) ? "#" : "+"}`;
  }
}
