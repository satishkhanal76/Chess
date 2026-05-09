import { Piece } from "../classes/pieces/Piece.js";
import { BlockGUI } from "./BlockGUI.js";
import FileRankFactory from "../classes/FileRankFactory.js";
import BoardInteractionHandler from "./utilities/BoardInteractionHandler.js";

export class BoardGUI {
  #gameGUI;
  #game;
  #board;

  #blocks;

  #element;



  #flipped;

  #ranks = [];
  #files = [];


  #boardContainerElement;
  #interactionHandler;


  constructor(gameGUI) {
    this.#flipped = false;

    this.#gameGUI = gameGUI;

    this.#game = this.#gameGUI.getGame();
    this.#board = this.#game.getBoard();

    this.createBoard();

    this.#createBlocks();
    this.updateBoard();

    const animationHandler = this.#gameGUI.getAnimationHandler();
    this.#interactionHandler = new BoardInteractionHandler(this, this.#gameGUI, this.#game, this.#board,  animationHandler);
  }

  createBoard() {
    this.#boardContainerElement = document.getElementById("board-container");
    this.#boardContainerElement.innerHTML = "";

    //create the board
    this.#element = document.createElement("div");
    this.#element.classList.add("board");
    this.#element.id = "board";

    const ranks = this.#createRanksContainer();
    const files = this.#createFilesContainer();

    this.#boardContainerElement.appendChild(ranks);
    this.#boardContainerElement.appendChild(this.#element);
    this.#boardContainerElement.appendChild(files);
  }


  #createRanksContainer() {
    const ranks = document.createElement("div");
    ranks.classList.add("ranks-container");
    this.#ranks = [];

    for (let i = 0; i < this.#board.getRow(); i++) {
      const rankElement = this.#createRankElement(i);
      this.#ranks.push(rankElement);
      ranks.appendChild(rankElement);
    }

    return ranks;
  }

  #createFilesContainer() {
    const files = document.createElement("div");
    files.classList.add("files-container");
    this.#files = [];

    for (let i = 0; i < this.#board.getColumn(); i++) {
      const fileElement = this.#createFileElement(i);
      this.#files.push(fileElement);
      files.appendChild(fileElement);
    }

    return files;
  }

  #createRankElement(row) {
    const rank = FileRankFactory.convertRowToRank(row);
    const rankElement = document.createElement("div");

    rankElement.classList.add("rank");
    rankElement.classList.add("block");
    rankElement.textContent = rank;
    rankElement.setAttribute("row", row);

    return rankElement;
  }

  #createFileElement(col) {
    const file = FileRankFactory.convertColToFile(col);
    const fileElement = document.createElement("div");

    fileElement.classList.add("file");
    fileElement.classList.add("block");
    fileElement.textContent = file;
    fileElement.setAttribute("col", col);

    return fileElement;
  }

  hightLightFileRank(fileRank) {
    const rankElement = this.#ranks.find(
      (rank) => parseInt(rank.getAttribute("row")) === fileRank.getRow()
    );
    const fileElement = this.#files.find(
      (file) => parseInt(file.getAttribute("col")) === fileRank.getCol()
    );
    rankElement.classList.add("highlighted");
    fileElement.classList.add("highlighted");
  }

  unHightLightFileRank() {
    this.#ranks.forEach((rankElement) =>
      rankElement.classList.remove("highlighted")
    );
    this.#files.find((fileElement) =>
      fileElement.classList.remove("highlighted")
    );
  }

  flipBoard() {
    this.#flipped = !this.#flipped;
    if (this.#flipped) {
      this.#boardContainerElement.classList.add("flipped");
    } else {
      this.#boardContainerElement.classList.remove("flipped");
    }
  }

  removeBoard() {
    this.#element.remove();
  }


  getBlock(fileRank) {
    return this.#blocks[fileRank.getRow()][fileRank.getCol()];
  }

  async clicked(block) {
    await this.#interactionHandler.handleClick(block);
  }


  getElement() {
    return this.#element;
  }


  showValidMoves(validMoves) {
    validMoves.forEach((move) => {
      const block = this.getBlock(
        FileRankFactory.getFileRank(move.col, move.row)
      );
      block.showAsValidBlock();
    });
  }


  #createBlockGrid(col, row) {
    this.#blocks = new Array(row);
    for (let i = 0; i < this.#blocks.length; i++) {
      this.#blocks[i] = new Array(col);
    }
  }

  #forEachBlock(callback) {
    for (let row = 0; row < this.#blocks.length; row++) {
      for (let col = 0; col < this.#blocks[row].length; col++) {
        const block = this.#blocks[row][col];
        const fileRank = FileRankFactory.getFileRank(col, row);
        const piece = this.#board.getPiece(fileRank);

        callback(block, fileRank, piece, col, row);
      }
    }
  }

  #createBlocks() {
    const columnLength = this.#board.getColumn();
    const rowLength = this.#board.getRow();
    this.#createBlockGrid(columnLength, rowLength);

    let rankStartingColour = Piece.COLOUR.WHITE;

    for (let row = 0; row < this.#blocks.length; row++) {
      this.#createBlockRow(row, rankStartingColour);
      rankStartingColour = this.#getOppositeColour(rankStartingColour);
    }
  }

  #createBlockRow(row, startingColour) {
    let blockColour = startingColour;

    for (let col = 0; col < this.#blocks[row].length; col++) {
      this.#createAndPlaceBlock(col, row, blockColour);
      blockColour = this.#getOppositeColour(blockColour);
    }
  }

  #createAndPlaceBlock(col, row, blockColour) {
    const fileRank = FileRankFactory.getFileRank(col, row);
    const piece = this.#board.getPiece(fileRank);
    const block = this.createBlock(fileRank, blockColour);

    this.#element.append(block.getElement());
    this.#blocks[row][col] = block;
    block.setText(piece ? piece.getCharacter() : " ");
  }

  #getOppositeColour(colour) {
    return colour === Piece.COLOUR.WHITE
      ? Piece.COLOUR.BLACK
      : Piece.COLOUR.WHITE;
  }

  createBlock(fileRank, lastColour) {
    const block = new BlockGUI(fileRank, lastColour);
    block.onClick(this);
    return block;
  }

  isFlipped() {
    return this.#flipped;
  }

  updateBoard() {
    this.#element.style.setProperty(
      "--num-of-columns",
      this.#board.getColumn()
    );

    this.#forEachBlock((block, fileRank, piece) => {
      block.setText(piece ? piece.getCharacter() : " ");
      block.hideAsValidBlock();
      block.removeCheckStyle();

      if (
        piece?.getType() === Piece.TYPE.KING &&
        this.#board.isKingInCheck(piece.getColour())
      ) {
        block.addCheckStyle();
      }
    });
  }

  updateCheckStyling() {
    const players = this.#game.getPlayers();

    players.forEach((player) => {
      const kingPos = this.#board.getPiecePosition(
        this.#board.getKingByColour(player.getColour())
      );
      const block = this.getBlock(kingPos);

      if (this.#board.isKingInCheck(player.getColour())) {
        block.addCheckStyle();
      } else {
        block.removeCheckStyle();
      }
    });
  }

  removeValidSoptsMark() {
    this.#forEachBlock((block) => {
      block.hideAsValidBlock();
    });
  }

  showBoardOnConsole() {
    const columnLength = this.#board.getColumn();
    const rowLenghth = this.#board.getRow();
    console.log(this.#board);

    let piece;
    let output = "";
    for (let i = 0; i < rowLenghth; i++) {
      for (let j = 0; j < columnLength; j++) {
        let fileRank = FileRankFactory.getFileRank(j, i);
        if (!fileRank) continue;
        piece = this.#board.getPiece(fileRank);
        output += piece ? piece.getCharacter() : " ";
      }
      output = output + "\n";
    }
    console.log(output);
  }
}
