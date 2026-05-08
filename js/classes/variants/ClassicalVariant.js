import { Board } from "../Board.js";
import FileRankFactory from "../FileRankFactory.js";
import ClassicalSet from "../board-sets/ClassicalSet.js";
import CheckmateValidator from "../validators/CheckmateValidator.js";
import StalemateValidator from "../validators/StalemateValidator.js";
import DeadPositionValidator from "../validators/DeadPositionValidator.js";
import ThreeFoldRepitionValidator from "../validators/ThreeFoldRepitionValidator.js";

export default class ClassicalVariant {
  #variantName;
  #board;
  #boardSet;

  constructor(variantName) {

    this.#variantName = variantName || "classical";
    this.createBoard();
  }

  createBoard() {
    this.setBoard(new Board(8, 8));
    FileRankFactory.resetFileRanks();
    this.#boardSet = new ClassicalSet(this.#board);
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
    ];
  }

  getVariantName() {
    return this.#variantName;
  }
}
