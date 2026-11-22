import FenPosition, { INITIAL_FEN } from "./FenPosition.js";
import FileRankFactory from "../FileRankFactory.js";
import { Piece } from "../pieces/Piece.js";

export default class GameState {
  #dimensions;

  constructor(fen = INITIAL_FEN, dimensions = {}) {
    this.#dimensions = dimensions;
    this.loadFen(fen);
  }

  loadFen(fen) {
    Object.assign(this, FenPosition.parse(fen, this.#dimensions));
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
      ["K", Piece.COLOUR.WHITE, true], ["Q", Piece.COLOUR.WHITE, false],
      ["k", Piece.COLOUR.BLACK, true], ["q", Piece.COLOUR.BLACK, false],
    ].filter(([right, colour, kingSide]) => {
      if (!this.castlingRights.includes(right)) return false;
      const king = board.getKingByColour(colour);
      const kingPosition = king && board.getPiecePosition(king);
      const homeRow = colour === Piece.COLOUR.WHITE ? board.getRow() - 1 : 0;
      if (!kingPosition || kingPosition.getRow() !== homeRow) return false;
      return board.getPiecesByTypeAndColour(Piece.TYPE.ROOK, colour).some((rook) => {
        const rookPosition = board.getPiecePosition(rook);
        return rookPosition.getRow() === homeRow &&
          (rookPosition.getCol() > kingPosition.getCol()) === kingSide;
      });
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
      this.removeRookRight(from, colour, board);
    }

    if (capturedPiece?.getType() === Piece.TYPE.ROOK) {
      const capturedAt = command.getTakingPiecePosition?.() || to;
      const capturedColour = capturedPiece.getColour() === Piece.COLOUR.WHITE ? "w" : "b";
      this.removeRookRight(capturedAt, capturedColour, board);
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

  removeRookRight(position, colour, board) {
    if (!position) return;
    const king = board.getKingByColour(colour === "w" ? Piece.COLOUR.WHITE : Piece.COLOUR.BLACK);
    const kingPosition = king && board.getPiecePosition(king);
    if (!kingPosition || kingPosition.getRow() !== position.getRow()) return;
    const right = position.getCol() > kingPosition.getCol() ? "K" : "Q";
    this.removeCastlingRights(colour === "w" ? right : right.toLowerCase());
  }

  getFen(board) {
    return FenPosition.serialize(board, this);
  }

  getPositionKey(board, enPassantIsAvailable = true) {
    return FenPosition.positionKey(board, this, enPassantIsAvailable);
  }
}
