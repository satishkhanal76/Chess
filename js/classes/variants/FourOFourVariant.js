import { Board } from "../Board.js";
import FileRankFactory from "../FileRankFactory.js";
import CustomSet from "../board-sets/CustomSet.js";
import ClassicalVariant from "./ClassicalVariant.js";

export default class FourOFourVariant extends ClassicalVariant {
  constructor(variantName) {
    super(variantName);
  }

  createBoard() {
    this.setBoard(new Board(8, 8));
    FileRankFactory.resetFileRanks();
    this.setBoardSet(
      new CustomSet(
        this.getBoard(),
        "rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR"
      )
    );
  }

  //   getPopulatedBoard() {
  //     this.#boardSet.populateBoard();
  //     return this.#board;
  //   }
}
