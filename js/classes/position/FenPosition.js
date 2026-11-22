import FileRankFactory from "../FileRankFactory.js";
import { Piece } from "../pieces/Piece.js";

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const VALID_PIECES = /^[pnbrqkPNBRQK]+$/;
const VALID_CASTLING = /^(?:-|K?Q?k?q?)$/;

export default class FenPosition {
  static parse(fen = INITIAL_FEN) {
    if (typeof fen !== "string") throw new TypeError("FEN must be a string.");
    const fields = fen.trim().split(/\s+/);
    if (fields.length !== 6) throw new Error("FEN must contain all six fields.");

    const [placement, activeColour, castling, enPassant, halfmove, fullmove] = fields;
    const ranks = placement.split("/");
    if (ranks.length !== 8) throw new Error("FEN piece placement must contain eight ranks.");

    for (const rank of ranks) {
      let files = 0;
      for (const character of rank) {
        if (/^[1-8]$/.test(character)) files += Number(character);
        else if (VALID_PIECES.test(character)) files += 1;
        else throw new Error(`Invalid FEN piece character: ${character}`);
      }
      if (files !== 8) throw new Error("Each FEN rank must describe exactly eight files.");
    }

    if (activeColour !== "w" && activeColour !== "b") throw new Error("FEN active colour must be 'w' or 'b'.");
    if (!VALID_CASTLING.test(castling)) throw new Error("Invalid FEN castling rights.");
    if (enPassant !== "-" && !/^[a-h][36]$/.test(enPassant)) throw new Error("Invalid FEN en-passant square.");
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
