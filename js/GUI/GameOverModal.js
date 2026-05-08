// Chess/js/GUI/GameOverModal.js
import { Piece } from "../classes/pieces/Piece.js";
import GameValidator from "../classes/validators/GameValidator.js";

export default class GameOverModal {
  #modal;

  constructor(modal) {
    this.#modal = modal;

    const closeButton = this.#modal.querySelector("#modal-close");
    closeButton.addEventListener("click", () => {
      this.#modal.style.display = "none";
    });
  }

  displayIfOver(game) {
    if (!game.isOver()) return;

    const text = this.#modal.querySelector(".modal-title");
    const display = this.#modal.querySelector(".display");

    display.innerHTML = "";
    display.className = "display";

    const winner = game.getWinner();

    if (winner) {
      this.#showWinner(game, winner, text, display);
    } else {
      this.#showDraw(game, text, display);
    }

    this.#modal.style.display = "block";
  }

  #showWinner(game, winner, text, display) {
    const avatar = document.createElement("div");
    avatar.classList.add("avatar");

    const winnerColour = winner.getColour();
    const winnerCharacter = game
      .getBoard()
      .getKingByColour(winnerColour)
      .getCharacter();

    text.textContent = `${
      winnerColour === Piece.COLOUR.WHITE ? "White" : "Black"
    } wins!`;

    display.classList.add("win");
    avatar.classList.add(
      `win-${winnerColour === Piece.COLOUR.WHITE ? "white" : "black"}`
    );
    avatar.textContent = winnerCharacter;

    display.appendChild(avatar);
  }

  #showDraw(game, text, display) {
    const avatar = document.createElement("div");
    const avatar2 = document.createElement("div");

    avatar.classList.add("avatar");
    avatar2.classList.add("avatar");

    text.textContent = this.#getDrawText(game);

    display.classList.add("stalemate");
    avatar.textContent = "♔";
    avatar2.textContent = "♚";

    display.appendChild(avatar);
    display.appendChild(avatar2);
  }

  #getDrawText(game) {
    const overValidator = game.getGameOverValidator?.();

    if (!overValidator) return "Draw!";

    switch (overValidator.getType()) {
      case GameValidator.TYPES.DRAW_BY_STALEMATE:
        return "Draw by stalemate!";
      case GameValidator.TYPES.DRAW_BY_DEADPOSITION:
        return "Draw by dead position!";
      case GameValidator.TYPES.DRAW_BY_REPITION:
        return "Draw by threefold repetition!";
      default:
        return "Draw!";
    }
  }
}