import BoardButtons from "./BoardButtons.js";
import { BoardGUI } from "./BoardGUI.js";
import AnimationHandler from "./animations/AnimationHandler.js";

export default class GameGUI {
  #game;
  #boardGUI;
  #buttonsGUI;

  #animationHandler;

  constructor(game) {
    this.#game = game;


    const modal = document.getElementById("modal");
    modal.style.display = "none";

    this.#animationHandler = new AnimationHandler(this);


    this.#boardGUI = new BoardGUI(this, modal);
    this.#buttonsGUI = new BoardButtons(this);



    this.#addEventListeners();
  }


  #addEventListeners() {
    this.#game.moveEventListeners.addListener((payload) => {
      this.#animationHandler.animateCommand(payload.command);
      this.#buttonsGUI.updateButtons();
    })
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

}
