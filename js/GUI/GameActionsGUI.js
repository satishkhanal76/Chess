import { Piece } from "../classes/pieces/Piece.js";

export default class GameActionsGUI {
  #game;
  #root;
  #clockRow;
  #pauseButton;
  #whiteClock;
  #blackClock;
  #drawButton;
  #claimButton;
  #resignButton;
  #gameStarted = false;
  #isOnline = false;

  constructor(game) {
    this.#game = game;
    this.#root = document.getElementById("game-actions");
    if (!this.#root) return;
    this.#createControls();
    this.#bindEvents();
    this.update();
  }

  #createControls() {
    this.#clockRow = document.createElement("div");
    this.#clockRow.className = "game-clocks";
    this.#whiteClock = this.#makeClock("White");
    this.#blackClock = this.#makeClock("Black");
    this.#clockRow.append(this.#whiteClock.root, this.#blackClock.root);

    const actions = document.createElement("div");
    actions.className = "game-action-buttons";
    this.#pauseButton = this.#makeButton("Pause clock");
    this.#drawButton = this.#makeButton("Offer draw");
    this.#claimButton = this.#makeButton("Claim draw");
    this.#resignButton = this.#makeButton("Resign");
    actions.append(this.#pauseButton, this.#drawButton, this.#claimButton, this.#resignButton);
    this.#root.replaceChildren(this.#clockRow, actions);
    this.#root.hidden = true;
  }

  #makeClock(label) {
    const root = document.createElement("div");
    root.className = "game-clock";
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("strong");
    value.textContent = "00:00";
    root.append(name, value);
    return { root, value };
  }

  #makeButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    return button;
  }

  #bindEvents() {
    this.#pauseButton.addEventListener("click", () => {
      const clock = this.#game.getClock();
      if (!clock) return;
      if (clock.getState().activeColour) clock.pause();
      else this.#game.startClock();
      this.update();
    });
    this.#drawButton.addEventListener("click", () => this.#handleDrawOffer());
    this.#claimButton.addEventListener("click", () => {
      this.#game.claimDraw(this.#game.getCurrentPlayer()?.getColour());
      this.update();
    });
    this.#resignButton.addEventListener("click", () => {
      if (window.confirm("Resign this game?")) {
        this.#game.resign(this.#game.getCurrentPlayer()?.getColour());
        this.update();
      }
    });
    this.#game.moveEventListeners.addListener(() => this.update());
    this.#game.resultEventListeners.addListener(() => this.update());
  }

  #handleDrawOffer() {
    const currentColour = this.#game.getCurrentPlayer()?.getColour();
    const offeredBy = this.#game.getDrawOffer();
    if (!offeredBy) this.#game.offerDraw(currentColour);
    else if (offeredBy !== currentColour) this.#game.acceptDraw(currentColour);
    this.update();
  }

  #formatTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  setGameStarted(started) {
    this.#gameStarted = Boolean(started);
    this.update();
  }

  update() {
    if (!this.#root) return;
    const gameOver = this.#game.isOver();
    const clock = this.#game.getClock();
    const currentColour = this.#game.getCurrentPlayer()?.getColour();
    const offer = this.#game.getDrawOffer();
    this.#root.hidden = !this.#gameStarted;
    this.#clockRow.hidden = !clock;
    this.#pauseButton.hidden = !clock || this.#isOnline;

    if (clock) {
      const state = clock.getState();
      this.#whiteClock.value.textContent = this.#formatTime(state.white);
      this.#blackClock.value.textContent = this.#formatTime(state.black);
      this.#whiteClock.root.classList.toggle("active", state.activeColour === "white");
      this.#blackClock.root.classList.toggle("active", state.activeColour === "black");
      this.#pauseButton.textContent = state.activeColour ? "Pause clock" : "Resume clock";
    }

    this.#drawButton.textContent = !offer
      ? "Offer draw"
      : offer === currentColour
        ? "Draw offered"
        : "Accept draw";
    this.#drawButton.disabled = gameOver || (offer && offer === currentColour) || this.#isOnline;
    this.#claimButton.disabled = gameOver || !this.#game.canClaimDraw() || this.#isOnline;
    this.#resignButton.disabled = gameOver || !currentColour || this.#isOnline;
    this.#pauseButton.disabled = gameOver || !clock;
  }

  setOnlineMode(isOnline) {
    this.#isOnline = Boolean(isOnline);
    this.update();
  }
}
