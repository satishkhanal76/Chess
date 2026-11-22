export default class TurnHandler {
  #players;
  #currentPlayerIndex;
  constructor(players) {
    this.#players = players || new Array();
    this.#currentPlayerIndex = 0;
  }

  getCurrentPlayer() {
    return this.#players[this.#currentPlayerIndex];
  }

  nextTurn() {
    this.#currentPlayerIndex =
      (this.#currentPlayerIndex + 1) % this.#players.length;
    return this.getCurrentPlayer();
  }

  previousTurn() {
    if (this.#players.length === 0) return null;
    this.#currentPlayerIndex =
      (this.#currentPlayerIndex - 1 + this.#players.length) % this.#players.length;
    return this.getCurrentPlayer();
  }

  setCurrentPlayerColour(colour) {
    const index = this.#players.findIndex((player) => player.getColour() === colour);
    if (index >= 0) this.#currentPlayerIndex = index;
    return this.getCurrentPlayer();
  }

  getPreviousPlayer() {
    const numPlayers = this.#players.length;
    const previousPlayerIndex =
      (this.#currentPlayerIndex - 1 + numPlayers) % numPlayers;
    return this.#players[previousPlayerIndex];
  }

  addPlayer(player) {
    if (!player) return;
    this.#players.push(player);
  }

  getPlayers() {
    return this.#players;
  }

  getPlayer(playerColour) {
    return this.#players.find((player) => player.getColour() === playerColour);
  }
}
