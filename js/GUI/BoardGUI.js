import { Piece } from "../classes/pieces/Piece.js";
import { BlockGUI } from "./BlockGUI.js";
import FileRankFactory from "../classes/FileRankFactory.js";
import { Command } from "../classes/commands/Command.js";
import PromotionModal from "./PromotionModal.js";
import Move from "../classes/Move.js";

export class BoardGUI {
  #gameGUI;
  #game;
  #board;

  #blocks;

  #element;

  #clickedPiece;

  #modal;

  #flipped;

  #ranks = [];
  #files = [];

  #animationHandler;

  #boardContainerElement;


  constructor(gameGUI, modal) {
    this.#flipped = false;

    this.#gameGUI = gameGUI;

    this.#game = this.#gameGUI.getGame();
    this.#board = this.#game.getBoard();

    this.#modal = modal;

    this.createBoard();

    this.#createBlocks();
    this.updateBoard();

    // this.setupButtons();
    this.#animationHandler = this.#gameGUI.getAnimationHandler();
  }

  createBoard() {
    this.#boardContainerElement = document.getElementById("board-container");

    //create the board
    this.#element = document.createElement("div");
    this.#element.classList.add("board");
    this.#element.id = "board";

    this.#boardContainerElement.style.setProperty(
      "--block-width",
      BlockGUI.BLOCK_WIDTH + "px"
    );
    this.#boardContainerElement.style.setProperty(
      "--block-height",
      BlockGUI.BLOCK_HEIGHT + "px"
    );

    //create the ranks
    const ranks = document.createElement("div");
    ranks.classList.add("ranks-container");

    for (let i = 0; i < this.#board.getRow(); i++) {
      let rank = FileRankFactory.convertRowToRank(i);
      const rankElement = document.createElement("div");
      rankElement.classList.add("rank");
      rankElement.classList.add("block");
      rankElement.textContent = rank;
      rankElement.setAttribute("row", i);
      this.#ranks.push(rankElement);
      ranks.appendChild(rankElement);
    }

    //create the files
    const files = document.createElement("div");
    files.classList.add("files-container");

    for (let i = 0; i < this.#board.getColumn(); i++) {
      let file = FileRankFactory.convertColToFile(i);
      const fileElement = document.createElement("div");
      fileElement.classList.add("file");
      fileElement.classList.add("block");
      fileElement.textContent = file;
      fileElement.setAttribute("col", i);
      this.#files.push(fileElement);
      files.appendChild(fileElement);
    }

    this.#boardContainerElement.appendChild(ranks);
    this.#boardContainerElement.appendChild(this.#element);
    this.#boardContainerElement.appendChild(files);
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
    const currentPlayer = this.#game.getCurrentPlayer();

    let piece = this.#board.getPiece(block.getFileRank());

    if (this.#clickedPiece) {

      const move = new Move(this.#clickedPiece.getFileRank(), block.getFileRank());
      const commandType = this.#game.getCommandType(move);

      if (
        this.#board.getCommandHandler().getCurrentCommandIndex() <
        this.#board.getCommandHandler().getCommandIndex()
      ) {
        await this.executeAllCommands();
      }



      if(commandType === Command.TYPES.PROMOTION_COMMAND) {
        const pomotionModal = new PromotionModal(currentPlayer.getColour());
        const promotionPieceType = await pomotionModal.askForPromotionPiece();
        move.setPromotionPieceType(promotionPieceType);
      }

      this.removeValidSoptsMark();
      this.#clickedPiece = null;

      this.#gameGUI.makeMove(move);

    } else {
      if (!piece) return null;
      if(piece.getColour() !== this.#game.getCurrentPlayer().getColour()) return null;

      this.#clickedPiece = block;

      // let validMoves = this.#game.getCurrentPlayer().getValidMoves(piece);
      const validMoves = this.#game.getBoard().getValidMoves(piece);
      
      if (!validMoves || validMoves.length < 1) {
        this.#clickedPiece = null;
      } else {
        this.showValidMoves(validMoves);
      }
    }

    this.updateCheckStyling();
  }

  

  async executeAllCommands() {
    const commandHandler = this.#board.getCommandHandler();
    let command;
    do {
      command = commandHandler.redoCommand();

      if (!command) break;

      await this.#animationHandler.animateCommand(command, false);
    } while (command);
  }

  getElement() {
    return this.#element;
  }

  /**
   * This method is a mess- need to refactor later
   * @returns
   */
  displayModalIfOver() {
    let isGameOver = this.#game.isOver();

    if (!isGameOver) return null;

    let text = this.#modal.querySelector(".modal-title");
    let display = this.#modal.querySelector(".display");

    let avatar = document.createElement("div");
    avatar.classList.add("avatar");
    let avatar2 = document.createElement("div");
    avatar2.classList.add("avatar");

    let winner = this.#game.getWinner();

    if (winner) {
      let winnerCharacter = this.#board.getKingByColour(winner.getColour()).getCharacter();
      text.textContent = `${
        winner?.getColour() === Piece.COLOUR.WHITE ? "White" : "Black"
      } wins!`;
      display.classList.add("win");
      avatar.classList.add(
        `win-${winner?.getColour() === Piece.COLOUR.WHITE ? "white" : "black"}`
      );
      avatar.textContent = winnerCharacter;
      display.appendChild(avatar);
    } else {
      text.textContent = `Stalemate!`;
      display.classList.add("stalemate");
      avatar.textContent = "♔";
      avatar2.textContent = "♚";
      display.appendChild(avatar);
      display.appendChild(avatar2);
    }

    this.#modal.style.display = "block";

    const closeButton = this.#modal.querySelector("#modal-close");

    closeButton.addEventListener("click", () => {
      this.#modal.style.display = "none";
    });
  }

  showValidMoves(validMoves) {
    validMoves.forEach((move) => {
      const block = this.getBlock(
        FileRankFactory.getFileRank(move.col, move.row)
      );
      block.showAsValidBlock();
    });
  }

  showBoard() {
    let grid = this.#board.getGrid();
    let piece;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        piece = grid[i][j];
        console.log(piece);
      }
    }
  }

  #createBlockGrid(col, row) {
    this.#blocks = new Array(row);
    for (let i = 0; i < this.#blocks.length; i++) {
      this.#blocks[i] = new Array(col);
    }
  }

  #createBlocks() {
    const columnLength = this.#board.getColumn();
    const rowLength = this.#board.getRow();
    this.#createBlockGrid(columnLength, rowLength);
    let piece;

    let block;
    let rankStartingColour = Piece.COLOUR.WHITE;
    let blockColour;

    for (let i = 0; i < this.#blocks.length; i++) {
      blockColour = rankStartingColour;

      // this.#element.append((document.createElement("span").textContent = i));
      for (let j = 0; j < this.#blocks[i].length; j++) {
        // console.log(FileRankFactory.getFileRank(j, i));
        piece = this.#board.getPiece(FileRankFactory.getFileRank(j, i));

        const fileRank = FileRankFactory.getFileRank(j, i);

        block = this.createBlock(fileRank, blockColour);
        this.#element.append(block.getElement());

        this.#blocks[i][j] = block;
        // this.#blocks.push(block);

        block.setText(piece ? piece.getCharacter() : " ");

        blockColour =
          blockColour === Piece.COLOUR.WHITE
            ? Piece.COLOUR.BLACK
            : Piece.COLOUR.WHITE;
      }
      rankStartingColour =
        rankStartingColour === Piece.COLOUR.WHITE
          ? Piece.COLOUR.BLACK
          : Piece.COLOUR.WHITE;
    }
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
    let piece;

    let block;

    for (let i = 0; i < this.#blocks.length; i++) {
      for (let j = 0; j < this.#blocks[i].length; j++) {
        piece = this.#board.getPiece(FileRankFactory.getFileRank(j, i));
        block = this.#blocks[i][j];

        block.setText(piece ? piece.getCharacter() : " ");
        block.hideAsValidBlock();
        if (!piece) continue;
        block.removeCheckStyle();
        if (
          piece.getType() === Piece.TYPE.KING &&
          this.#board.isKingInCheck(piece.getColour())
        )
          block.addCheckStyle();
      }
    }
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
    let piece;

    for (let i = 0; i < this.#blocks.length; i++) {
      for (let j = 0; j < this.#blocks[i].length; j++) {
        piece = this.#board.getPiece(FileRankFactory.getFileRank(j, i));

        const block = this.getBlock(FileRankFactory.getFileRank(j, i));
        block.hideAsValidBlock();
      }
    }
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
