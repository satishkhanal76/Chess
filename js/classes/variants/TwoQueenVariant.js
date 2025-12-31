import { Board } from "../Board.js";
import FileRankFactory from "../FileRankFactory.js";
import CustomSet from "../board-sets/CustomSet.js";
import ClassicalVariant from "./ClassicalVariant.js";

export default class TwoQueenVariant extends ClassicalVariant {
  constructor(variantName) {
    super(variantName);
  }

  createBoard() {
    this.setBoard(new Board(9, 8));
    FileRankFactory.resetFileRanks();
    this.setBoardSet(
      new CustomSet(
        this.getBoard(),
        "rnbqkqbnr/ppppppppp/8/8/8/8/PPPPPPPPP/RNBQKQBNR"
      )
    );
  }

  //   getPopulatedBoard() {
  //     this.#boardSet.populateBoard();
  //     return this.#board;
  //   }
}
