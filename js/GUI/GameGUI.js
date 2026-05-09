import BoardButtons from "./BoardButtons.js";
import { BoardGUI } from "./BoardGUI.js";
import AnimationHandler from "./animations/AnimationHandler.js";
import GameOverModal from "./GameOverModal.js";
import BoardSideDisplayGUI from "./BoardSideDisplayGUI.js";
import { Piece } from "../classes/pieces/Piece.js";

export default class GameGUI {
  #game;
  #boardGUI;
  #buttonsGUI;
  #boardSideDisplayGUI;
  #gameOverModal;

  #animationHandler;
  #canOnlyColourMove; //keeps track if only one colour can move

  constructor(game) {
    this.#game = game;
    this.#canOnlyColourMove = null;


    const modal = document.getElementById("modal");
    modal.style.display = "none";

    this.#animationHandler = new AnimationHandler(this);

    this.#gameOverModal = new GameOverModal(modal);


    this.#boardGUI = new BoardGUI(this);
    this.#buttonsGUI = new BoardButtons(this);
    this.#boardSideDisplayGUI = new BoardSideDisplayGUI();

    this.#addEventListeners();
  }

  #addEventListeners() {
    this.#game.moveEventListeners.addListener((payload) => {
      this.#handleMoveAnimation(payload);
    });

    this.#game.moveEventListeners.addListener((payload) => {
      this.#handleCapturedPieces(payload);
    });
    
    this.#game.moveEventListeners.addListener((payload) => {
      this.#boardSideDisplayGUI.highlightCurrentTurn(this.#game.getCurrentPlayer().getColour());
    });
  }

  async #handleMoveAnimation(payload) {
    await this.#animationHandler.animateCommand(payload.command);
    this.#boardGUI.updateBoard();
    this.#boardGUI.updateCheckStyling();
    this.#buttonsGUI.updateButtons();
    this.#gameOverModal.displayIfOver(this.#game);
  }

  #handleCapturedPieces(payload) {
    this.#boardSideDisplayGUI.addCapturedPieces(payload.piecesAffected);
  }


  // Called by board gui when the user wants to make a move
  makeMove(move) {
    if (!this.#canCurrentPlayerMove()) return;

    this.#tryMove(move);
  }

  #canCurrentPlayerMove() {
    return !this.#canOnlyColourMove ||
      this.#canOnlyColourMove === this.#game.getCurrentPlayer().getColour();
  }

  #tryMove(move) {
    try {
      const command = this.#game.movePiece(move);
      if (command && !command.isValid()) return;
    } catch (err) {
      console.error("Invalid command!");
    }
  }


  getBoardGUI() {
    return this.#boardGUI;
  }


  getButtonsGUI() {
    return this.#buttonsGUI;
  }

  getGame() {
    return this.#game;
  }

  getAnimationHandler() {
    return this.#animationHandler;
  }

  setCanOnlyColourMove(colour) {
    this.#canOnlyColourMove = colour;
  }

  setBoardOrientation(bottomColour) {
    this.#boardSideDisplayGUI.setBoardOrientation(bottomColour);
    this.#boardGUI.flipBoard();
  }

}
