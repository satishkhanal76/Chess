import { Board } from "./Board.js";
import FileRank from "./FileRank.js";

export default class FileRankFactory {
  static #fileRankFactoryInstance;

  #colLength;
  #rowLength;

  #fileRanks;

  constructor() {
    this.#colLength = Board.NUM_OF_COLUMNS;
    this.#rowLength = Board.NUM_OF_ROWS;

    this.#fileRanks = [];

    this.#createFileRanks();
  }

  getFileRank(col, row) {
    if (typeof col === "string") {
      return this.#fileRanks.find((fileRank) => fileRank.getFileRank() === col);
    } else {
      return this.#fileRanks.find(
        (fileRank) => fileRank.getCol() === col && fileRank.getRow() === row
      );
    }
  }

  static getFileRank(col = 0, row = 0) {
    if (!FileRankFactory.#fileRankFactoryInstance) {
      FileRankFactory.#fileRankFactoryInstance = new FileRankFactory();
    }

    return FileRankFactory.#fileRankFactoryInstance.getFileRank(col, row);
  }

  #createFileRanks() {
    for (let i = 0; i < this.#colLength; i++) {
      for (let j = 0; j < this.#rowLength; j++) {
        this.#fileRanks.push(
          new FileRank({
            col: i,
            row: j,
          })
        );
      }
    }
  }

  static resetFileRanks() {
    FileRankFactory.#fileRankFactoryInstance = undefined;
  }

  static convertRowToRank(row) {
    const baordHeight = 7;

    let rowRank = row - baordHeight;
    if (rowRank < 0) {
      rowRank = Math.abs(rowRank);
    }
    return rowRank + 1;
  }

  static convertColToFile(col) {
    const charCode = 97 + col;
    return String.fromCharCode(charCode);
  }

  static convertToFileRank(col, row) {
    const file = FileRankFactory.convertColToFile(col);
    const rank = FileRankFactory.convertRowToRank(row);

    return file.concat(rank);
  }

  static convertToColRow(fileRankString) {
    const lenghtOfString = fileRankString.length;
    if (lenghtOfString !== 2) return { col: 0, row: 0 };

    const file = fileRankString.charAt(0);
    const rank = fileRankString.charAt(1);

    return {
      col: FileRankFactory.#convertFileToCol(file),
      row: FileRankFactory.#convertRankToRow(rank),
    };
  }

  static #convertFileToCol(file) {
    const charCode = file.charCodeAt(0);
    const col = charCode - 97;
    return col;
  }

  static #convertRankToRow(rank) {
    const baordHeight = 7;
    const rankNumber = Number(rank) - 1;
    let row = rankNumber - baordHeight;
    if (row < 0) {
      row = Math.abs(row);
    }
    return row;
  }
}
