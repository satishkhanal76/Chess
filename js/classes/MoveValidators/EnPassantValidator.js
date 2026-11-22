import FileRankFactory from "../FileRankFactory.js";
import { Command } from "../commands/Command.js";
import { Piece } from "../pieces/Piece.js";
import ParentMoveValidator from "./ParentMoveValidator.js";

/**
 * Validates the EnPassant Rule in chess
 */

export default class EnPassantValidator extends ParentMoveValidator {
  constructor(board) {
    super(board);
  }

  getValidMoves(piece, moves) {
    if (piece.getType() !== Piece.TYPE.PAWN) return moves;

    const board = this.getBoard();
    const targetSquare = board.getEnPassantTarget?.();
    if (targetSquare) {
      const target = FileRankFactory.getFileRank(targetSquare);
      const origin = board.getPiecePosition(piece);
      const direction = piece.getColour() === Piece.COLOUR.WHITE ? -1 : 1;
      const victimPosition = FileRankFactory.getFileRank(
        target.getCol(),
        target.getRow() - direction
      );
      const victim = board.getPiece(victimPosition);
      const isAdjacent =
        origin.getRow() === target.getRow() - direction &&
        Math.abs(origin.getCol() - target.getCol()) === 1;

      if (
        isAdjacent &&
        victim?.getType() === Piece.TYPE.PAWN &&
        victim.getColour() !== piece.getColour() &&
        !board.willEnPassantPutKingInCheck(origin, target, victimPosition)
      ) {
        moves.push({ col: target.getCol(), row: target.getRow() });
      }
      return moves;
    }

    // En passant Logic

    // previous command(current command in the command handler) is the latest move made in the game
    const previousCommand = board.getCommandHandler().getCurrentCommand();

    // previous commad is not a move or does not exists
    if (
      !previousCommand ||
      previousCommand.getType() !== Command.TYPES.MOVE_COMMAND
    )
      return moves;

    const previousMovingPiece = previousCommand.getMovingPiece();

    // if the "assumed jumping piece" is an ally piece, En Passant not possible
    if (previousMovingPiece.getColour() == piece.getColour()) return moves;

    // if the "assumed jumping piece" is not a pawn, En Passant not possible
    if (previousMovingPiece.getType() !== Piece.TYPE.PAWN) return moves;

    // if the "assumed jumping piece" is actually didn't jump, En Passant not possible
    if (!previousMovingPiece.getJumpedFileRank()) return moves;

    /* this is an redundant if statement but
       this makes it so that if the pawn can jump multiple times in a game then checks to see if the latest jump was the last move */
    const previousMovingPieceFileRank = previousMovingPiece.getJumpedFileRank();
    if (previousMovingPieceFileRank !== previousCommand.getTo()) return moves;

    const thisPiecePosition = board.getPiecePosition(piece);

    // if the jumping enemy piece does not land on the same row as ally piece, En Passant not possible
    if (previousMovingPieceFileRank.getRow() !== thisPiecePosition.getRow())
      return moves;

    // if the enemy pawn is not on either side, En Passant not possible
    if (
      !(
        previousMovingPieceFileRank.getCol() ===
          thisPiecePosition.getCol() - 1 ||
        previousMovingPieceFileRank.getCol() === thisPiecePosition.getCol() + 1
      )
    )
      return moves;
    let move;
    if (piece.getColour() === Piece.COLOUR.WHITE) {
      move = {
        col: previousMovingPieceFileRank.getCol(),
        row: previousMovingPieceFileRank.getRow() - 1,
      };
    } else {
      move = {
        col: previousMovingPieceFileRank.getCol(),
        row: previousMovingPieceFileRank.getRow() + 1,
      };
    }
    // if this move puts king in check, En Passant not possible
    if (
      !this.getBoard().willMovePutKingInCheck(
        thisPiecePosition,
        FileRankFactory.getFileRank(move.col, move.row)
      )
    ) {
      moves.push(move);
    }

    return moves;
  }
}
