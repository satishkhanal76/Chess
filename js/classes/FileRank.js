import FileRankFactory from "./FileRankFactory.js";

export default class FileRank {
  #file;
  #rank;

  #col;
  #row;

  constructor(colRowOrFileRank) {
    if (typeof colRowOrFileRank === "string") {
      const colRow = FileRankFactory.convertToColRow(colRowOrFileRank);
      this.#col = colRow.col;
      this.#row = colRow.row;
      this.#file = colRowOrFileRank.charAt(0);
      this.#rank = colRowOrFileRank.charAt(1);
    } else {
      this.#col = colRowOrFileRank.col;
      this.#row = colRowOrFileRank.row;
      const fileRank = FileRankFactory.convertToFileRank(this.#col, this.#row);
      this.#file = fileRank.charAt(0);
      this.#rank = fileRank.charAt(1);
    }
  }

  getCol() {
    return this.#col;
  }

  getRow() {
    return this.#row;
  }

  getFile() {
    return this.#file;
  }

  getRank() {
    return this.#rank;
  }

  getFileRank() {
    return this.#file.concat(this.#rank);
  }

  
  toString() {
    return this.getFileRank();
  }

  toJSON() {
    return {
      col: this.#col,
      row: this.#row
    }
  }
}
