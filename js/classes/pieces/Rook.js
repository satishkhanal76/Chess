import FileRankFactory from "../FileRankFactory.js";
import { Movement } from "./Movement.js";
import { Piece } from "./Piece.js";

export class Rook extends Piece {
  constructor(piece, colour) {
    super(piece.type, piece.character, colour, piece.FEN);
    this.configureMoves();
  }

  configureMoves() {
    super.addMoves(Movement.getVerticalToTop);
    super.addMoves(Movement.getVerticalToBottom);
    super.addMoves(Movement.getHorizontalToLeft);
    super.addMoves(Movement.getHorizontalToRight);
  }

  pathToKing(board) {
    let dimension = {
      col: board.getColumn(),
      row: board.getRow(),
    };

    let piecePosition = board.getPiecePosition(this);
    piecePosition = {
      col: piecePosition.getCol(),
      row: piecePosition.getRow(),
    };
    let kingExistsObj = {};

    for (let i = 0; i < this.getMoves().length; i++) {
      const move = this.getMoves()[i];
      let spots = move(dimension, piecePosition);
      if (!spots) continue;
      kingExistsObj = this.checkPathForKing(board, spots);
      if (kingExistsObj.kingExists) return kingExistsObj.spots;
    }
    return null;
  }

  checkPathForKing(board, spots) {
    let kingExistsObj = {
      kingExists: false,
    };

    for (let i = 0; i < spots.length; i++) {
      let spot = spots[i];
      spot = FileRankFactory.getFileRank(spot.col, spot.row);
      let pieceAtTheSpot = board.getPiece(spot);

      if (!pieceAtTheSpot) continue;
      if (pieceAtTheSpot.getColour() !== this.getColour()) {
        kingExistsObj.kingExists = false;
        break;
      }
      if (pieceAtTheSpot.getType() !== Piece.TYPE.KING) {
        kingExistsObj.kingExists = false;
        break;
      }

      kingExistsObj.kingExists = true;
      spots = spots.splice(0, i);
      break;
    }

    kingExistsObj.spots = spots;
    return kingExistsObj;
  }
}
