import { Board } from "../Board.js";
import FileRankFactory from "../FileRankFactory.js";
import ClassicalSet from "../board-sets/ClassicalSet.js";
import CheckmateValidator from "../validators/CheckmateValidator.js";
import StalemateValidator from "../validators/StalemateValidator.js";
import DeadPositionValidator from "../validators/DeadPositionValidator.js";
import ThreeFoldRepitionValidator from "../validators/ThreeFoldRepitionValidator.js";
import FiveFoldRepetitionValidator from "../validators/FiveFoldRepetitionValidator.js";
import SeventyFiveMoveValidator from "../validators/SeventyFiveMoveValidator.js";
import FenPosition, { INITIAL_FEN } from "../position/FenPosition.js";

export default class ClassicalVariant {
  #variantName;
  #board;
  #boardSet;
  #startingFen;

  constructor(variantName, startingFen = INITIAL_FEN) {

    this.#variantName = variantName || "classical";
    this.#startingFen = startingFen;
    this.createBoard();
  }

  createBoard() {
    this.setBoard(new Board(8, 8));
    FileRankFactory.resetFileRanks();
    this.#boardSet = new ClassicalSet(this.#board);
    this.#boardSet.setFenString(FenPosition.parse(this.#startingFen, this.getBoardDimensions()).placement);
  }

  getPopulatedBoard() {
    this.#boardSet.populateBoard();
    return this.#board;
  }

  setBoard(board) {
    this.#board = board;
  }
  getBoard() {
    return this.#board;
  }

  setBoardSet(boardSet) {
    return (this.#boardSet = boardSet);
  }

  getBoardSet() {
    return this.#boardSet;
  }

  getGameValidators(game) {
    return [
      new CheckmateValidator(game),
      new StalemateValidator(game),
      new DeadPositionValidator(game),
      new ThreeFoldRepitionValidator(game),
      new FiveFoldRepetitionValidator(game),
      new SeventyFiveMoveValidator(game),
    ];
  }

  getVariantName() {
    return this.#variantName;
  }

  getStartingFen() {
    return this.#startingFen;
  }

  getBoardDimensions() {
    return { rows: this.#board.getRow(), columns: this.#board.getColumn() };
  }

  getStartingCastlingRights() {
    return this.#variantName === "classical" ? "KQkq" : "-";
  }

  createCopy() {
    return new this.constructor(this.#variantName, this.#startingFen);
  }

  setStartingFen(fen) {
    const parsed = FenPosition.parse(fen, this.getBoardDimensions());
    this.#startingFen = fen;
    this.#boardSet.setFenString(parsed.placement);
  }
}
