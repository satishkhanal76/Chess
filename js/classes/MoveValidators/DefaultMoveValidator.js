import FileRankFactory from "../FileRankFactory.js";
import ParentMoveValidator from "./ParentMoveValidator.js";

export default class DefaultMoveValidator extends ParentMoveValidator {
  constructor(board) {
    super(board);
  }

  getValidMoves(piece, validMoves) {
    let to;
    const board = this.getBoard();

    const piecePosition = board.getPiecePosition(piece);

    // Get all the moves that the piece can do(constrains to the board)

    validMoves = piece.getAvailableMoves(board); 

    for (let i = validMoves.length - 1; i >= 0; i--) {
      to = validMoves[i];
      if(!to) continue;

      const toFileRank = FileRankFactory.getFileRank(to.col, to.row);

      //if this move puts king at risk than its not valid
      if (board.willMovePutKingInCheck(piecePosition, toFileRank)) {
        validMoves.splice(i, 1);
      }
    }
    return validMoves;
  }
}
