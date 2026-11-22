// Chess/js/GUI/GameOverModal.js
import { Piece } from "../classes/pieces/Piece.js";
import GameValidator from "../classes/validators/GameValidator.js";
import { renderPieceMarkup } from "./PieceRenderer.js";

export default class GameOverModal {
  #modal;

  constructor(modal) {
    this.#modal = modal;

    const closeButton = this.#modal.querySelector("#modal-close");
    closeButton.addEventListener("click", () => {
      this.#modal.style.display = "none";
      this.#modal.parentElement.classList.remove("is-visible");
    });
  }

  displayIfOver(game) {
    if (!game.isOver()) return;

    const text = this.#modal.querySelector(".modal-title");
    const display = this.#modal.querySelector(".display");

    display.innerHTML = "";
    display.className = "display result-display";

    const winner = game.getWinner();
    const result = game.getResult() || {};
    if (winner) {
      this.#showWinner(game, winner, text, display);
    } else {
      this.#showDraw(game, text, display);
    }

    this.#appendResultDetails(game, result, display);
    this.#modal.parentElement.classList.add("is-visible");
    this.#modal.style.display = "block";
  }

  #showWinner(game, winner, text, display) {
    const avatar = document.createElement("div");
    avatar.classList.add("avatar");

    const winnerColour = winner.getColour();
    const winnerCharacter = game.getBoard().getKingByColour(winnerColour).getCharacter();

    text.textContent = `${
      winnerColour === Piece.COLOUR.WHITE ? "White" : "Black"
    } wins!`;

    display.classList.add("win");
    avatar.classList.add(
      `win-${winnerColour === Piece.COLOUR.WHITE ? "white" : "black"}`
    );
    const winnerMarkup = renderPieceMarkup(winnerCharacter);
    if (winnerMarkup) avatar.innerHTML = winnerMarkup;
    else avatar.textContent = winnerCharacter;

    display.appendChild(avatar);
  }

  #showDraw(game, text, display) {
    const avatar = document.createElement("div");
    const avatar2 = document.createElement("div");

    avatar.classList.add("avatar");
    avatar2.classList.add("avatar");

    text.textContent = this.#getDrawText(game);

    display.classList.add("stalemate");
    const whiteKing = renderPieceMarkup("♔");
    const blackKing = renderPieceMarkup("♚");
    if (whiteKing && blackKing) {
      avatar.innerHTML = whiteKing;
      avatar2.innerHTML = blackKing;
    } else {
      avatar.textContent = "♔";
      avatar2.textContent = "♚";
    }

    display.appendChild(avatar);
    display.appendChild(avatar2);
  }

  #appendResultDetails(game, result, display) {
    const reason = document.createElement("p");
    reason.className = "result-reason";
    reason.textContent = this.#getReasonDescription(game, result);

    const summary = document.createElement("div");
    summary.className = "result-summary";
    const moveCount = document.createElement("span");
    moveCount.textContent = `${game.getMoveRecords().length} moves recorded`;
    const resultType = document.createElement("span");
    resultType.textContent = this.#getResultLabel(result);
    summary.append(moveCount, resultType);
    display.append(reason, summary);
  }

  #getReasonDescription(game, result) {
    switch (result.type) {
      case "checkmate":
        return "The side to move was in check and had no legal moves.";
      case "resignation": {
        const loser = result.winner === "WHITE" ? "Black" : "White";
        return result.reason === "disconnect"
          ? `${loser} disconnected and forfeited by resignation.`
          : `${loser} resigned.`;
      }
      case "timeout": {
        const loser = result.winner === "WHITE" ? "Black" : "White";
        return `${loser} ran out of time.`;
      }
      case "draw":
        return this.#getDrawDescription(game.getDrawReason());
      case "pgn-result":
        return "The imported game ended with this result.";
      default:
        return "The game has ended.";
    }
  }

  #getDrawDescription(reason) {
    switch (reason) {
      case GameValidator.TYPES.DRAW_BY_STALEMATE:
        return "The side to move had no legal moves and was not in check.";
      case GameValidator.TYPES.DRAW_BY_DEADPOSITION:
        return "Neither side can possibly checkmate from this position.";
      case GameValidator.TYPES.DRAW_BY_REPITION:
        return "The same position occurred three times.";
      case GameValidator.TYPES.DRAW_BY_FIVEFOLD_REPETITION:
        return "The same position occurred five times.";
      case GameValidator.TYPES.DRAW_BY_FIFTY_MOVE:
        return "Fifty moves by each side passed without a pawn move or capture.";
      case GameValidator.TYPES.DRAW_BY_SEVENTY_FIVE_MOVE:
        return "Seventy-five moves by each side passed without a pawn move or capture.";
      case GameValidator.TYPES.DRAW_BY_AGREEMENT:
        return "Both players agreed to a draw.";
      default:
        return "The game ended in a draw.";
    }
  }

  #getResultLabel(result) {
    switch (result.type) {
      case "checkmate": return "Checkmate";
      case "resignation": return "Resignation";
      case "timeout": return "Time expired";
      case "draw": return "Draw";
      case "pgn-result": return "Imported result";
      default: return "Game ended";
    }
  }

  #getDrawText(game) {
    switch (game.getDrawReason()) {
      case GameValidator.TYPES.DRAW_BY_STALEMATE:
        return "Draw by stalemate!";
      case GameValidator.TYPES.DRAW_BY_DEADPOSITION:
        return "Draw by dead position!";
      case GameValidator.TYPES.DRAW_BY_REPITION:
        return "Draw by threefold repetition!";
      case GameValidator.TYPES.DRAW_BY_FIVEFOLD_REPETITION:
        return "Draw by fivefold repetition!";
      case GameValidator.TYPES.DRAW_BY_FIFTY_MOVE:
        return "Draw by the fifty-move rule!";
      case GameValidator.TYPES.DRAW_BY_SEVENTY_FIVE_MOVE:
        return "Draw by the seventy-five-move rule!";
      case GameValidator.TYPES.DRAW_BY_AGREEMENT:
        return "Draw by agreement!";
      default:
        return "Draw!";
    }
  }
}
