import { Piece } from "../classes/pieces/Piece.js";
import { BlockGUI } from "./BlockGUI.js";
import FileRankFactory from "../classes/FileRankFactory.js";
import { Command } from "../classes/commands/Command.js";

export class BoardGUI {
  #game;
  #board;

  #blocks;

  #element;

  #clickedPiece;

  #modal;

  #animationTime = 250;

  #promise;

  #commandsDisabled;

  #flipped;

  constructor(game, modal) {
    this.#flipped = false;
    this.#game = game;
    this.#board = game.getBoard();

    this.#modal = modal;

    this.#element = document.createElement("div");
    this.#element.classList.add("board");
    this.#element.id = "board";
    document.getElementById("board-container").appendChild(this.#element);

    this.#commandsDisabled = false;

    this.#createBlocks();
    this.updateBoard();

    this.setupButtons();
  }

  flipBoard() {
    this.#flipped = !this.#flipped;
    if (this.#flipped) {
      this.#element.classList.add("flipped");
    } else {
      this.#element.classList.remove("flipped");
    }
  }

  removeBoard() {
    this.#element.remove();
  }

  setupButtons() {
    let prev = document.getElementById("previous");
    let next = document.getElementById("next");
    let current = document.getElementById("current");

    prev.addEventListener("click", async () => {
      if (this.#commandsDisabled) return null;
      this.#commandsDisabled = true;
      this.#promise = this.#board.getCommandHandler().undoCommand();

      const element = await this.animateCommand(this.#promise, true);

      this.removeElement(element);

      this.updateButtons();
      this.#commandsDisabled = false;
    });

    next.addEventListener("click", async () => {
      if (this.#commandsDisabled) return null;
      this.#commandsDisabled = true;
      this.#promise = this.#board.getCommandHandler().redoCommand();

      const element = await this.animateCommand(this.#promise);

      this.removeElement(element);

      this.updateButtons();
      this.#commandsDisabled = false;
    });

    current.addEventListener("click", async (eve) => {
      this.#commandsDisabled = true;

      await this.executeAllCommands();
      this.updateButtons();
      this.#commandsDisabled = false;
    });

    this.updateButtons();

    // document.addEventListener("keypress", (eve) => {
    //   console.log(eve.key);

    //   this.#board.findPinAndChecks(Piece.COLOUR.BLACK);
    // });

    document.addEventListener("keydown", (eve) => {
      switch (eve.key) {
        case "ArrowLeft":
          prev.click();
          break;
        case "ArrowRight":
          next.click();
          break;
        case "Enter":
          current.click();
          break;
        case "2":
          this.#game.changeVariant(new TwoQueenVariant(this.#game));
          this.#board = this.#game.getBoard();
          this.#createBlocks();
          this.updateBoard();

          this.setupButtons();
          break;
        case "f":
          this.flipBoard();
          break;
        default:
          break;
      }
    });
  }

  async animateCommand(command, undo = false) {
    if (!command) return null;
    let data;
    if (undo) {
      if (command.getType() === Command.TYPES.CASTLE_COMMAND) {
        data = await this.animateCasstleCommand(
          command,
          this.getBlock(command.getKingNewPosition()),
          this.getBlock(command.getRookNewPosition()),
          true
        );
      } else {
        data = await this.animateMoveCommand(
          command,
          this.getBlock(command.getTo()),
          true
        );
      }
    } else {
      if (command.getType() === Command.TYPES.CASTLE_COMMAND) {
        data = await this.animateCasstleCommand(
          command,
          this.getBlock(command.getKingPosition()),
          this.getBlock(command.getRookPosition())
        );
      } else {
        data = await this.animateMoveCommand(
          command,
          this.getBlock(command.getFrom())
        );
      }
    }

    this.updateCheckStyling();
    if (data) {
      this.flipBoard();
    }

    return data;
  }

  getBlock(fileRank) {
    return this.#blocks[fileRank.getRow()][fileRank.getCol()];
    // return this.#blocks.find(
    //   (block) =>
    //     block.getFileRank().getCol() === fileRank.getCol() &&
    //     block.getFileRank().getRow() === fileRank.getRow()
    // );
  }

  async clicked(block) {
    let element;
    const currentPlayer = this.#game.getCurrentPlayer();

    let piece = this.#board.getPiece(block.getFileRank());

    if (this.#clickedPiece) {
      let fromPiece = this.#board.getPiece(this.#clickedPiece.getFileRank());
      let toPiece = this.#board.getPiece(block.getFileRank());

      let from = {
        col: this.#clickedPiece.getFileRank().getCol(),
        row: this.#clickedPiece.getFileRank().getRow(),
      };
      let to = {
        col: block.getFileRank().getCol(),
        row: block.getFileRank().getRow(),
      };
      if (
        this.#board.getCommandHandler().getCurrentCommandIndex() <
        this.#board.getCommandHandler().getCommandIndex()
      ) {
        await this.executeAllCommands();
      }

      if (
        fromPiece?.getColour() === toPiece?.getColour() &&
        fromPiece?.getType() === Piece.TYPE.KING &&
        toPiece?.getType() === Piece.TYPE.ROOK
      ) {
        //disable the commands for the animation
        if (this.#commandsDisabled) return null;
        this.#commandsDisabled = true;

        this.#promise = currentPlayer.castle(
          this.#clickedPiece.getFileRank(),
          block.getFileRank()
        );

        element = await this.animateCommand(this.#promise);

        //reenable the commands for the animation
        this.#commandsDisabled = false;
      } else if (
        fromPiece.getType() === Piece.TYPE.PAWN &&
        fromPiece.getPromotionRow() === block.getFileRank().getRow()
      ) {
        //disable the commands for the animation
        if (this.#commandsDisabled) return null;
        this.#commandsDisabled = true;

        this.#promise = currentPlayer.promotePiece(
          this.#board.getPiece(this.#clickedPiece.getFileRank()),
          block.getFileRank(),
          Piece.TYPE.QUEEN
        );
        element = await this.animateCommand(this.#promise);
        this.#commandsDisabled = false;
      } else {
        //disable the commands for the animation
        if (this.#commandsDisabled) return null;
        this.#commandsDisabled = true;

        try {
          this.#promise = currentPlayer.movePiece(
            this.#board.getPiece(this.#clickedPiece.getFileRank()),
            block.getFileRank()
          );
          element = await this.animateCommand(this.#promise);
        } catch (error) {
          console.log(error);
        }

        this.#commandsDisabled = false;
      }

      this.removeElement(element);
      this.removeValidSoptsMark();

      // this.updateBoard();

      this.displayModalIfOver();
      this.updateButtons();
      this.#clickedPiece = null;
    } else {
      if (!piece) return null;

      this.#clickedPiece = block;

      let validMoves = this.#game.getCurrentPlayer().getValidMoves(piece);
      if (!validMoves || validMoves.length < 1) {
        this.#clickedPiece = null;
      } else {
        this.showValidMoves(validMoves);
      }
    }
  }

  async executeAllCommands() {
    const commandHandler = this.#board.getCommandHandler();

    do {
      this.#promise = commandHandler.redoCommand();

      if (!this.#promise) break;

      const animationObject = await this.animateCommand(this.#promise);

      this.updateButtons();
      // this.updateBoard();

      this.removeElement(animationObject);
    } while (this.#promise);
  }

  removeElement(animationObject) {
    if (!animationObject) return null;

    let animatedBlock;

    if (animationObject instanceof Array) {
      animationObject.forEach((animation) => {
        animatedBlock = animation["animatedBlock"];
        animatedBlock?.getElement()?.remove();
      });
    } else {
      animatedBlock = animationObject["animatedBlock"];
      animatedBlock?.getElement()?.remove();
    }
  }

  async animateMoveCommand(command, piece, undo = false) {
    let data;
    const from = {
      col: command.getFrom().getCol(),
      row: command.getFrom().getRow(),
    };
    const to = {
      col: command.getTo().getCol(),
      row: command.getTo().getRow(),
    };

    const movingPiece = command.getMovingPiece();
    const takingPiece = command.getTakingPiece();

    if (!command.isAValidCommand()) return null;

    if (undo) {
      if (takingPiece) {
        if (command.getType() === Command.TYPES.EN_PASSANT_COMMAND) {
          data = await Promise.all([
            this.animateBlock(to, from, piece, movingPiece.getCharacter()),
            this.getBlock(command.getTakingPiecePosition()).fadeInText(
              takingPiece.getCharacter()
            ),
          ]);
        } else {
          data = await Promise.all([
            this.animateBlock(to, from, piece, movingPiece.getCharacter()),
            this.getBlock(command.getTo()).fadeInText(
              takingPiece.getCharacter()
            ),
          ]);
        }

        this.getBlock(command.getFrom()).setText(movingPiece.getCharacter());
        data = data.shift();
      } else {
        data = await this.animateBlock(
          to,
          from,
          piece,
          movingPiece.getCharacter()
        );
        this.getBlock(command.getFrom()).setText(movingPiece.getCharacter());
        this.getBlock(command.getTo()).setText(" ");
        // this.getBlock(command.getTo()).fadeOutText();
      }
    } else {
      data = await this.animateBlock(
        from,
        to,
        piece,
        movingPiece.getCharacter()
      );

      if (command.getType() === Command.TYPES.EN_PASSANT_COMMAND) {
        this.getBlock(command.getTakingPiecePosition()).fadeOutText();
        // this.getBlock(command.getTakingPiecePosition()).setText(" ");
      }
      this.getBlock(command.getTo()).setText(movingPiece.getCharacter());
      if (command.getType() === Command.TYPES.PROMOTION_COMMAND) {
        this.getBlock(command.getTo()).setText(
          command.getPromotionPiece().getCharacter()
        );
      }
    }

    return data;
  }

  async animateCasstleCommand(command, kingBlock, rookBlock, undo = false) {
    let data;
    const fromKing = {
      col: command.getKingPosition().getCol(),
      row: command.getKingPosition().getRow(),
    };
    const toKing = {
      col: command.getKingNewPosition().getCol(),
      row: command.getKingNewPosition().getRow(),
    };
    const fromRook = {
      col: command.getRookPosition().getCol(),
      row: command.getRookPosition().getRow(),
    };
    const toRook = {
      col: command.getRookNewPosition().getCol(),
      row: command.getRookNewPosition().getRow(),
    };
    const kingText = command.getKing().getCharacter();
    const rookText = command.getRook().getCharacter();

    if (undo) {
      data = await Promise.all([
        this.animateBlock(toKing, fromKing, kingBlock, kingText),
        this.animateBlock(toRook, fromRook, rookBlock, rookText),
      ]);
      this.getBlock(command.getKingPosition()).setText(kingText);
      this.getBlock(command.getRookPosition()).setText(rookText);
    } else {
      data = await Promise.all([
        this.animateBlock(fromKing, toKing, kingBlock, kingText),
        this.animateBlock(fromRook, toRook, rookBlock, rookText),
      ]);
      this.getBlock(command.getKingNewPosition()).setText(kingText);
      this.getBlock(command.getRookNewPosition()).setText(rookText);
    }
    return data;
  }
  updateButtons(disable = false) {
    let prev = document.getElementById("previous");
    let next = document.getElementById("next");
    let current = document.getElementById("current");
    let commandHandler = this.#board.getCommandHandler();

    let currentCommandIndex = commandHandler.getCurrentCommandIndex();
    let commandIndex = commandHandler.getCommandIndex();

    prev.disabled = true;
    next.disabled = true;
    current.disabled = true;

    if (currentCommandIndex === -1 && commandIndex === -1) return;

    if (currentCommandIndex <= commandIndex && currentCommandIndex > -1) {
      prev.disabled = false;
    }
    if (currentCommandIndex < commandIndex) {
      next.disabled = false;
      current.disabled = false;
    }

    if (disable) {
      prev.disabled = false;
      next.disabled = false;
      current.disabled = false;
    }
  }

  /**
   * This method is a mess- need to refactor later
   * @returns
   */
  displayModalIfOver() {
    let isGameOver = this.#game.isOver();

    if (!isGameOver) return null;

    this.#modal.style.display = "block";

    let text = this.#modal.querySelector(".modal-title");
    let display = this.#modal.querySelector(".display");

    let avatar = document.createElement("div");
    avatar.classList.add("avatar");
    let avatar2 = document.createElement("div");
    avatar2.classList.add("avatar");

    let winner = this.#game.getWinner();
    let winnerCharacter =
      winner?.getColour() === Piece.COLOUR.WHITE ? "♔" : "♚";

    if (winner) {
      text.textContent = `${
        winner?.getColour() === Piece.COLOUR.WHITE ? "White" : "Black"
      } wins!`;
      console.log(winner);
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

  animateBlock(from, to, block, text) {
    return new Promise(async (resolve, reject) => {
      let newBlock;

      newBlock = new BlockGUI(
        FileRankFactory.getFileRank(to.col, to.row),
        this
      );

      newBlock.setText(text);
      const element = newBlock.getElement();
      element.style.position = "absolute";

      if (this.isFlipped()) {
        element.classList.add("flipped");
      }

      this.#element.append(element);

      const offsetFrom = {
        col: from.col * element.offsetWidth,
        row: from.row * element.offsetHeight,
      };
      const offsetTo = {
        col: to.col * element.offsetWidth,
        row: to.row * element.offsetHeight,
      };

      element.style.setProperty("--from-col", offsetFrom.col + "px");
      element.style.setProperty("--from-row", offsetFrom.row + "px");
      element.style.setProperty("--to-col", offsetTo.col + "px");
      element.style.setProperty("--to-row", offsetTo.row + "px");

      this.removeValidSoptsMark();

      // block.fadeOutText();

      block.setText(" ");
      // block.fadeOutText();
      // this.updateCheckStyling()
      block.removeCheckStyle();

      element.style.animation = `animate-move ${
        this.#animationTime
      }ms cubic-bezier( 0.215, 0.61, 0.355, 1 )`;

      setTimeout(() => {
        element.style.top = offsetTo.row + "px";
        element.style.left = offsetTo.col + "px";
        resolve({
          from,
          to,
          animatedBlock: newBlock,
          blockToBeAnimated: block,
          replacingBlock: this.getBlock(
            FileRankFactory.getFileRank(to.col, to.row)
          ),
        });
      }, this.#animationTime);
    });
  }

  createBlock(fileRank, lastColour) {
    return new BlockGUI(fileRank, this, lastColour);
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
      const kingPos = this.#board.getPiecePosition(player.findKing());
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

  getCommandDisabled() {
    return this.#commandsDisabled;
  }
}
