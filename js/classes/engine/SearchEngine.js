import Move from "../Move.js";
import FileRankFactory from "../FileRankFactory.js";
import { Piece } from "../pieces/Piece.js";

const MATE_SCORE = 100000;
const VALUE = {
  [Piece.TYPE.PAWN]: 100,
  [Piece.TYPE.KNIGHT]: 320,
  [Piece.TYPE.BISHOP]: 330,
  [Piece.TYPE.ROOK]: 500,
  [Piece.TYPE.QUEEN]: 900,
  [Piece.TYPE.KING]: 0,
};

export default class SearchEngine {
  constructor({ depth = 2 } = {}) {
    this.setDepth(depth);
  }

  setDepth(depth) {
    if (!Number.isInteger(depth) || depth < 1 || depth > 5) {
      throw new RangeError("Search depth must be an integer from 1 to 5.");
    }
    this.depth = depth;
  }

  findBestMove(game) {
    const rootSide = game.getCurrentPlayer()?.getColour();
    if (!rootSide || game.isOver()) return null;
    const moves = this.#orderMoves(game, game.getLegalMoves(rootSide));
    if (!moves.length) return null;

    let bestMove = moves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const move of moves) {
      const child = this.#playOnCopy(game, move);
      const score = this.#search(child, this.depth - 1, alpha, beta, rootSide);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    }
    return bestMove;
  }

  #search(game, depth, alpha, beta, rootSide) {
    if (game.isOver()) {
      const result = game.getResult();
      if (result?.type === "draw") return 0;
      if (result?.winner === rootSide) return MATE_SCORE + depth;
      return -MATE_SCORE - depth;
    }

    const side = game.getCurrentPlayer()?.getColour();
    const moves = this.#orderMoves(game, game.getLegalMoves(side));
    if (!moves.length) {
      return game.getBoard().isKingInCheck(side)
        ? side === rootSide ? -MATE_SCORE - depth : MATE_SCORE + depth
        : 0;
    }
    if (depth <= 0) return this.#evaluate(game.getBoard(), rootSide);

    const maximizing = side === rootSide;
    let best = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
      const score = this.#search(this.#playOnCopy(game, move), depth - 1, alpha, beta, rootSide);
      if (maximizing) {
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
      } else {
        best = Math.min(best, score);
        beta = Math.min(beta, best);
      }
      if (beta <= alpha) break;
    }
    return best;
  }

  #playOnCopy(game, move) {
    const copy = game.createCopy();
    copy.addPlayer({ getColour: () => Piece.COLOUR.WHITE });
    copy.addPlayer({ getColour: () => Piece.COLOUR.BLACK });
    const from = FileRankFactory.getFileRank(move.getFrom().getFileRank());
    const to = FileRankFactory.getFileRank(move.getTo().getFileRank());
    copy.movePiece(new Move(from, to, { promotionPieceType: move.getPromotionPieceType() }));
    return copy;
  }

  #orderMoves(game, moves) {
    const board = game.getBoard();
    return [...moves].sort((first, second) => {
      const score = (move) => {
        const target = board.getPiece(move.getTo());
        const attacker = board.getPiece(move.getFrom());
        if (!target || target.getColour() === attacker?.getColour()) return 0;
        return 10 * VALUE[target.getType()] - VALUE[attacker?.getType()];
      };
      return score(second) - score(first);
    });
  }

  #evaluate(board, rootSide) {
    let score = 0;
    for (const piece of board.getAllPieces()) {
      const value = VALUE[piece.getType()] || 0;
      score += piece.getColour() === rootSide ? value : -value;
    }
    return score;
  }
}
