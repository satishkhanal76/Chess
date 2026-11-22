import FenPosition, { INITIAL_FEN } from "./FenPosition.js";
import FileRankFactory from "../FileRankFactory.js";
import { Piece } from "../pieces/Piece.js";

export default class GameState {
  constructor(fen = INITIAL_FEN) {
    this.loadFen(fen);
  }

  loadFen(fen) {
    Object.assign(this, FenPosition.parse(fen));
  }

  snapshot() {
    return {
      placement: this.placement,
      activeColour: this.activeColour,
      castlingRights: this.castlingRights,
      enPassantTarget: this.enPassantTarget,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
    };
  }

  restore(snapshot) {
    Object.assign(this, snapshot);
  }

  applyToBoard(board) {
    const rights = [
      ["K", "e1", "h1"], ["Q", "e1", "a1"],
      ["k", "e8", "h8"], ["q", "e8", "a8"],
    ].filter(([right, kingSquare, rookSquare]) => {
      if (!this.castlingRights.includes(right)) return false;
      return board.getPiece(FileRankFactory.getFileRank(kingSquare))?.getType() === Piece.TYPE.KING &&
        board.getPiece(FileRankFactory.getFileRank(rookSquare))?.getType() === Piece.TYPE.ROOK;
    }).map(([right]) => right).join("");
    this.castlingRights = rights;
    board.setCastlingRights(rights);
    board.setEnPassantTarget(this.enPassantTarget === "-" ? null : this.enPassantTarget);
  }

  updateAfterMove(command, board, movingColour) {
    const movingPiece = command.getMovingPiece();
    const capturedPiece = command.getTakingPiece?.();
    const from = command.getFrom?.() || command.getKingPosition?.();
    const to = command.getTo?.() || command.getKingNewPosition?.();
    const colour = movingColour === Piece.COLOUR.WHITE ? "w" : "b";

    this.enPassantTarget = "-";
    if (movingPiece.getType() === Piece.TYPE.KING) {
      this.removeCastlingRights(colour === "w" ? "KQ" : "kq");
    } else if (movingPiece.getType() === Piece.TYPE.ROOK) {
      this.removeRookRight(from, colour);
    }

    if (capturedPiece?.getType() === Piece.TYPE.ROOK) {
      const capturedAt = command.getTakingPiecePosition?.() || to;
      const capturedColour = capturedPiece.getColour() === Piece.COLOUR.WHITE ? "w" : "b";
      this.removeRookRight(capturedAt, capturedColour);
    }

    if (movingPiece.getType() === Piece.TYPE.PAWN) {
      this.halfmoveClock = 0;
      if (Math.abs(from.getRow() - to.getRow()) === 2) {
        const targetRow = (from.getRow() + to.getRow()) / 2;
        this.enPassantTarget = FileRankFactory.getFileRank(to.getCol(), targetRow).getFileRank();
      }
    } else if (capturedPiece) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock += 1;
    }

    if (colour === "b") this.fullmoveNumber += 1;
    this.activeColour = colour === "w" ? "b" : "w";
    this.placement = FenPosition.placementFromBoard(board);
    this.applyToBoard(board);
  }

  removeCastlingRights(rights) {
    this.castlingRights = [...this.castlingRights].filter((right) => !rights.includes(right)).join("");
  }

  removeRookRight(position, colour) {
    if (!position) return;
    const square = position.getFileRank();
    const rightsBySquare = {
      a1: "Q", h1: "K", a8: "q", h8: "k",
    };
    const right = rightsBySquare[square];
    if (right && (colour === "w" ? right === "Q" || right === "K" : right === "q" || right === "k")) {
      this.removeCastlingRights(right);
    }
  }

  getFen(board) {
    return FenPosition.serialize(board, this);
  }

  getPositionKey(board, enPassantIsAvailable = true) {
    return FenPosition.positionKey(board, this, enPassantIsAvailable);
  }
}
