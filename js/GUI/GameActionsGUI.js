import ChessClock from "../classes/clock/ChessClock.js";
import { Piece } from "../classes/pieces/Piece.js";

const PRESETS = {
  "5+0": { minutes: 5, increment: 0 },
  "3+2": { minutes: 3, increment: 2 },
  "10+0": { minutes: 10, increment: 0 },
  "15+10": { minutes: 15, increment: 10 },
};

export default class GameActionsGUI {
  #game;
  #root;
  #clockSelect;
  #clockButton;
  #whiteClock;
  #blackClock;
  #drawButton;
  #claimButton;
  #resignButton;

  constructor(game) {
    this.#game = game;
    this.#root = document.getElementById("game-actions");
    if (!this.#root) return;
    this.#createControls();
    this.#bindEvents();
    this.update();
  }

  #createControls() {
    const clocks = document.createElement("div");
    clocks.className = "game-clocks";
    this.#whiteClock = this.#makeClock("White", "05:00");
    this.#blackClock = this.#makeClock("Black", "05:00");
    clocks.append(this.#whiteClock.root, this.#blackClock.root);

    const actions = document.createElement("div");
    actions.className = "game-action-buttons";
    this.#clockSelect = document.createElement("select");
    this.#clockSelect.setAttribute("aria-label", "Time control");
    for (const preset of Object.keys(PRESETS)) {
      const option = document.createElement("option");
      option.value = preset;
      option.textContent = `${preset} clock`;
      this.#clockSelect.append(option);
    }
    this.#clockButton = this.#makeButton("Start clock");
    this.#drawButton = this.#makeButton("Offer draw");
    this.#claimButton = this.#makeButton("Claim draw");
    this.#resignButton = this.#makeButton("Resign");
    actions.append(this.#clockSelect, this.#clockButton, this.#drawButton, this.#claimButton, this.#resignButton);
    this.#root.replaceChildren(clocks, actions);
  }

  #makeClock(label, initialTime) {
    const root = document.createElement("div");
    root.className = "game-clock";
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("strong");
    value.textContent = initialTime;
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
    this.#clockButton.addEventListener("click", () => this.#toggleClock());
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

  #toggleClock() {
    let clock = this.#game.getClock();
    if (!clock) {
      const preset = PRESETS[this.#clockSelect.value];
      clock = new ChessClock({
        initialTimeMs: preset.minutes * 60000,
        incrementMs: preset.increment * 1000,
      });
      this.#game.setClock(clock);
      clock.subscribe(() => this.update());
    }

    if (clock.getState().activeColour) clock.pause();
    else this.#game.startClock();
    this.update();
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

  update() {
    if (!this.#root) return;
    const gameOver = this.#game.isOver();
    const clock = this.#game.getClock();
    const currentColour = this.#game.getCurrentPlayer()?.getColour();
    const offer = this.#game.getDrawOffer();

    this.#clockSelect.disabled = Boolean(clock) || gameOver;
    this.#clockButton.disabled = gameOver || !this.#game.getIsInProgress();
    this.#clockButton.textContent = clock
      ? (clock.getState().activeColour ? "Pause clock" : "Resume clock")
      : "Start clock";
    if (clock) {
      const state = clock.getState();
      this.#whiteClock.value.textContent = this.#formatTime(state.white);
      this.#blackClock.value.textContent = this.#formatTime(state.black);
      this.#whiteClock.root.classList.toggle("active", state.activeColour === "white");
      this.#blackClock.root.classList.toggle("active", state.activeColour === "black");
    }

    this.#drawButton.textContent = !offer
      ? "Offer draw"
      : offer === currentColour
        ? "Draw offered"
        : "Accept draw";
    this.#drawButton.disabled = gameOver || Boolean(offer && offer === currentColour);
    this.#claimButton.disabled = gameOver || !this.#game.canClaimDraw();
    this.#resignButton.disabled = gameOver || !currentColour;
  }

  setOnlineMode(isOnline) {
    this.#root?.classList.toggle("is-online", isOnline);
    if (isOnline && this.#root) this.#root.hidden = true;
  }
}
