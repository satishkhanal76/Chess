export default class GameActionsGUI {
  #game;
  #root;
  #pauseButton;
  #whiteClock;
  #blackClock;
  #drawButton;
  #declineDrawButton;
  #claimButton;
  #resignButton;
  #gameStarted = false;
  #isOnline = false;
  #onlinePlayerColour = null;
  #onlineDrawOffer = null;
  #onlineActionHandlers = {};
  #clockSubscription = null;
  #subscribedClock = null;

  constructor(game) {
    this.#game = game;
    this.#root = document.getElementById("game-actions");
    if (!this.#root) return;
    this.#createControls();
    this.#bindEvents();
    this.update();
  }

  #createControls() {
    this.#whiteClock = this.#makeClock("White");
    this.#blackClock = this.#makeClock("Black");
    this.setBoardOrientation("WHITE");

    const actions = document.createElement("div");
    actions.className = "game-action-buttons";
    this.#pauseButton = this.#makeButton("Pause clock");
    this.#drawButton = this.#makeButton("Offer draw");
    this.#declineDrawButton = this.#makeButton("Decline draw");
    this.#claimButton = this.#makeButton("Claim draw");
    this.#resignButton = this.#makeButton("Resign");
    actions.append(this.#pauseButton, this.#drawButton, this.#declineDrawButton, this.#claimButton, this.#resignButton);
    this.#root.replaceChildren(actions);
    this.#root.hidden = true;
  }

  #makeClock(label) {
    const root = document.createElement("div");
    root.className = "game-clock";
    root.setAttribute("aria-label", `${label} clock`);
    const value = document.createElement("strong");
    value.textContent = "00:00";
    root.append(value);
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
    this.#declineDrawButton.addEventListener("click", () => this.#onlineActionHandlers.declineDraw?.());
    this.#claimButton.addEventListener("click", () => {
      if (this.#isOnline) this.#onlineActionHandlers.claimDraw?.();
      else this.#game.claimDraw(this.#game.getCurrentPlayer()?.getColour());
      this.update();
    });
    this.#resignButton.addEventListener("click", () => {
      if (window.confirm("Resign this game?")) {
        if (this.#isOnline) this.#onlineActionHandlers.resign?.();
        else this.#game.resign(this.#game.getCurrentPlayer()?.getColour());
        this.update();
      }
    });
    this.#game.moveEventListeners.addListener(() => this.update());
    this.#game.resultEventListeners.addListener(() => this.update());
  }

  #handleDrawOffer() {
    if (this.#isOnline) {
      if (!this.#onlineDrawOffer) this.#onlineActionHandlers.offerDraw?.();
      else if (this.#onlineDrawOffer !== this.#onlinePlayerColour) this.#onlineActionHandlers.acceptDraw?.();
      return;
    }
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
    this.#syncClockSubscription(clock);
    this.#root.hidden = !this.#gameStarted;
    this.#pauseButton.hidden = !clock || this.#isOnline;
    this.#whiteClock.root.hidden = !clock;
    this.#blackClock.root.hidden = !clock;

    if (clock) {
      const state = clock.getState();
      this.#whiteClock.value.textContent = this.#formatTime(state.white);
      this.#blackClock.value.textContent = this.#formatTime(state.black);
      this.#whiteClock.root.classList.toggle("active", state.activeColour === "white");
      this.#blackClock.root.classList.toggle("active", state.activeColour === "black");
      this.#pauseButton.textContent = state.activeColour ? "Pause clock" : "Resume clock";
    }

    const visibleOffer = this.#isOnline ? this.#onlineDrawOffer : offer;
    this.#drawButton.textContent = !visibleOffer
      ? "Offer draw"
      : visibleOffer === (this.#isOnline ? this.#onlinePlayerColour : currentColour)
        ? "Draw offered"
        : "Accept draw";
    this.#drawButton.disabled = gameOver || (visibleOffer && visibleOffer === (this.#isOnline ? this.#onlinePlayerColour : currentColour));
    this.#declineDrawButton.hidden = !this.#isOnline || !visibleOffer || visibleOffer === this.#onlinePlayerColour;
    this.#declineDrawButton.disabled = gameOver || this.#declineDrawButton.hidden;
    this.#claimButton.disabled = gameOver || !this.#game.canClaimDraw() || (this.#isOnline && currentColour !== this.#onlinePlayerColour);
    this.#resignButton.disabled = gameOver || (this.#isOnline ? !this.#onlinePlayerColour : !currentColour);
    this.#pauseButton.disabled = gameOver || !clock;
  }

  #syncClockSubscription(clock) {
    if (clock === this.#subscribedClock) return;
    this.#clockSubscription?.();
    this.#clockSubscription = null;
    this.#subscribedClock = clock;
    if (clock) {
      this.#clockSubscription = clock.subscribe((state) => this.#renderClockState(state));
      this.#renderClockState(clock.getState());
    }
  }

  #renderClockState(state) {
    this.#whiteClock.value.textContent = this.#formatTime(state.white);
    this.#blackClock.value.textContent = this.#formatTime(state.black);
    this.#whiteClock.root.classList.toggle("active", state.activeColour === "white");
    this.#blackClock.root.classList.toggle("active", state.activeColour === "black");
  }

  setOnlineMode(isOnline) {
    this.#isOnline = Boolean(isOnline);
    this.update();
  }

  setBoardOrientation(bottomColour) {
    const topSlot = document.getElementById("top-player-clock");
    const bottomSlot = document.getElementById("bottom-player-clock");
    if (!topSlot || !bottomSlot || !this.#whiteClock || !this.#blackClock) return;
    const bottomClock = bottomColour === "BLACK" ? this.#blackClock : this.#whiteClock;
    const topClock = bottomColour === "BLACK" ? this.#whiteClock : this.#blackClock;
    topSlot.replaceChildren(topClock.root);
    bottomSlot.replaceChildren(bottomClock.root);
  }

  setOnlineActionHandlers(handlers = {}) {
    this.#onlineActionHandlers = handlers;
    this.update();
  }

  setOnlinePlayerColour(colour) {
    this.#onlinePlayerColour = colour;
    this.update();
  }

  setOnlineDrawOffer(colour) {
    this.#onlineDrawOffer = colour || null;
    this.update();
  }
}
