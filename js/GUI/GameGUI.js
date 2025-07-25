import PieceAffect from "../classes/commands/PieceAffect.js";
import { Piece } from "../classes/pieces/Piece.js";
import BoardButtons from "./BoardButtons.js";
import { BoardGUI } from "./BoardGUI.js";
import AnimationHandler from "./animations/AnimationHandler.js";

export default class GameGUI {
  #game;
  #boardGUI;
  #buttonsGUI;

  #animationHandler;
  #canOnlyColourMove; //keeps track if only one colour can move

  constructor(game) {
    this.#game = game;
    this.#canOnlyColourMove = null;


    const modal = document.getElementById("modal");
    modal.style.display = "none";

    this.#animationHandler = new AnimationHandler(this);


    this.#boardGUI = new BoardGUI(this, modal);
    this.#buttonsGUI = new BoardButtons(this);



    this.#addEventListeners();
  }


  #addEventListeners() {
    this.#game.moveEventListeners.addListener(async (payload) => {
      await this.#animationHandler.animateCommand(payload.command);
      this.#boardGUI.updateBoard();
      this.#boardGUI.updateCheckStyling();
      this.#buttonsGUI.updateButtons();
      this.#boardGUI.displayModalIfOver();
    })

    this.#game.moveEventListeners.addListener((payload) => {
      const capturedPieces = payload.piecesAffected.filter((p) => p.getAffectType() === PieceAffect.AFFECT_TYPES.CAPTURE).map((p) => p.getPiece());
      const blackCapturedPiecesElement = document.getElementById("blackCapturedPieces");
      const whiteCapturedPiecesElement = document.getElementById("whiteCapturedPieces");


      capturedPieces.forEach(piece => {
        const pieceElement = document.createElement("span");
        pieceElement.textContent = piece.getCharacter();

        (piece.getColour() === Piece.COLOUR.WHITE) ?
          blackCapturedPiecesElement.appendChild(pieceElement)
        : whiteCapturedPiecesElement.appendChild(pieceElement);
      });

    })
  }


  // Called by board gui when the user wants to make a move
  makeMove(move) {
    if(this.#canOnlyColourMove && this.#canOnlyColourMove !== this.#game.getCurrentPlayer().getColour()) return;
    
    try {
      const command = this.#game.movePiece(move);
      if(command && !command.isValid()) return;

    }catch(err) {
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

}
