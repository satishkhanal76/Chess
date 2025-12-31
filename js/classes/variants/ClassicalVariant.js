import { Board } from "../Board.js";
import FileRankFactory from "../FileRankFactory.js";
import ClassicalSet from "../board-sets/ClassicalSet.js";

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

  getVariantName() {
    return this.#variantName;
  }
}
