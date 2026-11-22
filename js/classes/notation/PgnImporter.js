import { Game } from "../Game.js";
import ClassicalVariant from "../variants/ClassicalVariant.js";
import { Player } from "../players/Player.js";
import { Piece } from "../pieces/Piece.js";
import FileRankFactory from "../FileRankFactory.js";
import Move from "../Move.js";

const RESULT_TOKENS = new Set(["1-0", "0-1", "1/2-1/2", "*"]);
const PIECE_TYPES = {
  K: Piece.TYPE.KING,
  Q: Piece.TYPE.QUEEN,
  R: Piece.TYPE.ROOK,
  B: Piece.TYPE.BISHOP,
  N: Piece.TYPE.KNIGHT,
};

export default class PgnImporter {
  static import(pgn, { variant = new ClassicalVariant() } = {}) {
    if (typeof pgn !== "string") throw new TypeError("PGN must be a string.");
    const headers = {};
    const movetext = pgn.replace(/^[ \t]*\[([^\s]+)[ \t]+"((?:\\.|[^"])*)"\][ \t]*$/gm, (_, key, value) => {
      headers[key] = value.replaceAll('\\"', '"').replaceAll("\\\\", "\\");
      return "";
    });
    const fen = headers.SetUp === "1" ? headers.FEN : undefined;
    const game = new Game(variant, fen);
    game.addPlayer(new Player(Piece.COLOUR.WHITE));
    game.addPlayer(new Player(Piece.COLOUR.BLACK));

    const tokens = this.#tokens(movetext);
    for (const token of tokens) this.#playSan(game, token);
    const resultToken = movetext.match(/(1-0|0-1|1\/2-1\/2|\*)\s*$/)?.[1] || headers.Result;
    if (resultToken) game.setImportedResult(resultToken);
    return { game, headers };
  }

  static #tokens(movetext) {
    let text = movetext.replace(/\{[^}]*\}/gs, "").replace(/;[^\n]*/g, "");
    let depth = 0;
    text = [...text].filter((character) => {
      if (character === "(") depth += 1;
      if (character === ")") depth = Math.max(0, depth - 1);
      return depth === 0 && character !== "(" && character !== ")";
    }).join("");

    return text.split(/\s+/).flatMap((raw) => {
      const token = raw.replace(/^\d+\.(?:\.\.)?/, "").replace(/\$\d+/g, "").replace(/^\$\d+$/, "");
      if (!token || /^\d+\.{1,3}$/.test(token) || RESULT_TOKENS.has(token)) return [];
      return [token];
    });
  }

  static #playSan(game, source) {
    const san = source.replace(/[!?]+$/g, "").replace(/[+#]+$/g, "").replaceAll("0", "O");
    const side = game.getCurrentPlayer().getColour();
    const legalMoves = game.getLegalMoves(side);

    if (san === "O-O" || san === "O-O-O") {
      const kingSide = san === "O-O";
      const castle = legalMoves.find((move) => {
        const piece = game.getBoard().getPiece(move.getFrom());
        const targetPiece = game.getBoard().getPiece(move.getTo());
        return piece?.getType() === Piece.TYPE.KING &&
          targetPiece?.getType() === Piece.TYPE.ROOK &&
          (move.getTo().getCol() > move.getFrom().getCol()) === kingSide;
      });
      if (!castle) throw new Error(`Illegal PGN castling move: ${source}`);
      game.movePiece(castle);
      return;
    }

    const promotionMatch = san.match(/=([QRBN])$/);
    const promotionType = promotionMatch ? PIECE_TYPES[promotionMatch[1]] : undefined;
    const withoutPromotion = san.replace(/=[QRBN]$/, "");
    const destinationMatch = withoutPromotion.match(/([a-h][1-8])$/);
    if (!destinationMatch) throw new Error(`Invalid PGN move: ${source}`);

    const destination = destinationMatch[1];
    const prefix = withoutPromotion.slice(0, -destination.length);
    const pieceLetter = /^[KQRBN]/.test(prefix) ? prefix[0] : "";
    const pieceType = pieceLetter ? PIECE_TYPES[pieceLetter] : Piece.TYPE.PAWN;
    const remainder = pieceLetter ? prefix.slice(1) : prefix;
    const isCapture = remainder.includes("x");
    const disambiguation = remainder.replace("x", "");
    const target = FileRankFactory.getFileRank(destination);

    const candidates = legalMoves.filter((move) => {
      const piece = game.getBoard().getPiece(move.getFrom());
      if (piece?.getType() !== pieceType) return false;
      if (move.getTo().getFileRank() !== destination) return false;
      if (promotionType && move.getPromotionPieceType() !== promotionType) return false;
      if (pieceType === Piece.TYPE.PAWN && move.getTo().getRow() === piece.getPromotionRow() && !promotionType) return false;

      const from = move.getFrom();
      if (disambiguation.includes(from.getFile()) && pieceType !== Piece.TYPE.PAWN) {
        // File disambiguation is satisfied; rank may also be present.
      } else if (disambiguation.includes(from.getRank()) && pieceType !== Piece.TYPE.PAWN) {
        // Rank disambiguation is satisfied.
      } else if (disambiguation && pieceType !== Piece.TYPE.PAWN) {
        return false;
      } else if (pieceType === Piece.TYPE.PAWN && isCapture && from.getFile() !== disambiguation[0]) {
        return false;
      }

      const destinationPiece = game.getBoard().getPiece(target);
      const captureByMove = Boolean(destinationPiece) || (pieceType === Piece.TYPE.PAWN && from.getCol() !== target.getCol());
      return captureByMove === isCapture;
    });

    if (candidates.length !== 1) throw new Error(`PGN move is ${candidates.length ? "ambiguous" : "illegal"}: ${source}`);
    const move = candidates[0];
    game.movePiece(new Move(move.getFrom(), move.getTo(), { promotionPieceType: promotionType }));
  }
}
