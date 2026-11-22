import FileRankFactory from "../FileRankFactory.js";
import { Piece } from "../pieces/Piece.js";

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const VALID_PIECES = /^[pnbrqkPNBRQK]+$/;
const VALID_CASTLING = /^(?:-|K?Q?k?q?)$/;

export default class FenPosition {
  static parse(fen = INITIAL_FEN, { rows = 8, columns = 8 } = {}) {
    if (typeof fen !== "string") throw new TypeError("FEN must be a string.");
    const fields = fen.trim().split(/\s+/);
    if (fields.length !== 6) throw new Error("FEN must contain all six fields.");

    const [placement, activeColour, castling, enPassant, halfmove, fullmove] = fields;
    const ranks = placement.split("/");
    if (ranks.length !== rows) throw new Error(`FEN piece placement must contain ${rows} ranks.`);

    for (const rank of ranks) {
      let files = 0;
      for (let index = 0; index < rank.length; index += 1) {
        const character = rank[index];
        if (/\d/.test(character)) {
          let end = index + 1;
          while (end < rank.length && /\d/.test(rank[end])) end += 1;
          const emptySquares = Number(rank.slice(index, end));
          if (!emptySquares) throw new Error("FEN empty-square counts must be positive.");
          files += emptySquares;
          index = end - 1;
        } else if (VALID_PIECES.test(character)) files += 1;
        else throw new Error(`Invalid FEN piece character: ${character}`);
      }
      if (files !== columns) throw new Error(`Each FEN rank must describe exactly ${columns} files.`);
    }

    if (activeColour !== "w" && activeColour !== "b") throw new Error("FEN active colour must be 'w' or 'b'.");
    if (!VALID_CASTLING.test(castling)) throw new Error("Invalid FEN castling rights.");
    const enPassantMatch = enPassant === "-" ? null : enPassant.match(/^([a-z])([36])$/);
    if (enPassant !== "-" && (!enPassantMatch || enPassantMatch[1].charCodeAt(0) - 97 >= columns)) {
      throw new Error("Invalid FEN en-passant square.");
    }
    if (enPassant !== "-" && enPassant[1] !== (activeColour === "w" ? "6" : "3")) {
      throw new Error("FEN en-passant rank does not match the active colour.");
    }
    if (!/^\d+$/.test(halfmove) || !/^\d+$/.test(fullmove) || Number(fullmove) < 1) {
      throw new Error("FEN move counters must be non-negative integers and fullmove must be at least one.");
    }

    return {
      placement,
      activeColour,
      castlingRights: castling === "-" ? "" : "KQkq".split("").filter((right) => castling.includes(right)).join(""),
      enPassantTarget: enPassant,
      halfmoveClock: Number(halfmove),
      fullmoveNumber: Number(fullmove),
    };
  }

  static placementFromBoard(board) {
    const ranks = [];
    for (let row = 0; row < board.getRow(); row += 1) {
      let rank = "";
      let empty = 0;
      for (let col = 0; col < board.getColumn(); col += 1) {
        const piece = board.getPiece(FileRankFactory.getFileRank(col, row));
        if (!piece) {
          empty += 1;
          continue;
        }
        if (empty) rank += String(empty);
        empty = 0;
        rank += piece.getFenCharacter();
      }
      if (empty) rank += String(empty);
      ranks.push(rank);
    }
    return ranks.join("/");
  }

  static serialize(board, state) {
    const castling = state.castlingRights || "-";
    const ep = state.enPassantTarget || "-";
    return `${this.placementFromBoard(board)} ${state.activeColour} ${castling} ${ep} ${state.halfmoveClock} ${state.fullmoveNumber}`;
  }

  static positionKey(board, state, enPassantIsAvailable = true) {
    const ep = enPassantIsAvailable ? state.enPassantTarget : "-";
    return `${this.placementFromBoard(board)} ${state.activeColour} ${state.castlingRights || "-"} ${ep || "-"}`;
  }
}
