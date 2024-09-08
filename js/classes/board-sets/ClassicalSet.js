import FileRankFactory from "../FileRankFactory.js";
import { PieceFactory } from "../pieces/PieceFactory.js";

export default class ClassicalSet {
  #FEN_STRING = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
  #board;
  constructor(board) {
    this.#board = board;
  }

  populateBoard() {
    //extract all the rows into an array
    const ranks = this.#FEN_STRING.split("/");

    //for each row of the fen string
    for (let i = 0; i < ranks.length; i++) {
      //if the number of rows from the fen string is greater than the number of rows in the board, ignore it
      if (i >= this.#board.getRow()) continue;
      const rank = ranks[i];

      let col = 0;
      //for each column in the row of the fen string
      for (let j = 0; j < rank.length; j++) {
        //if the number of column from the fen string is greater than the number of column in the board, ignore it
        if (col >= this.#board.getColumn()) continue;

        //get the character for each column
        const character = rank.charAt(j);

        //check to see if the character is a number, if it is we need to skip that many rows
        const numberOfSkips = parseInt(character);

        if (!isNaN(numberOfSkips)) {
          col = col + numberOfSkips;
          continue;
        }

        const piece = PieceFactory.getPieceFen(character);
        const fileRank = FileRankFactory.getFileRank(col, i);

        this.#board.placePiece(piece, fileRank);

        col = col + 1;
      }
    }
  }

  setFenString(fenString) {
    this.#FEN_STRING = fenString;
  }
}
