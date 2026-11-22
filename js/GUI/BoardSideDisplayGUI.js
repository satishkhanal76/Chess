import PieceAffect from "../classes/commands/PieceAffect.js";
import { Piece } from "../classes/pieces/Piece.js";
import { renderPieceMarkup } from "./PieceRenderer.js";

export default class BoardSideDisplayGUI {
  #topCapturedPiecesElement;
  #bottomCapturedPiecesElement;
  #topPlayerNameElement;
  #bottomPlayerNameElement;
  #bottomColour;

  constructor() {
    this.#topCapturedPiecesElement = document.getElementById("topCapturedPieces");
    this.#bottomCapturedPiecesElement = document.getElementById("bottomCapturedPieces");

    this.#topPlayerNameElement = document.getElementById("top-player-name");
    this.#bottomPlayerNameElement = document.getElementById("bottom-player-name");

    this.setBoardOrientation(Piece.COLOUR.WHITE);
    this.highlightCurrentTurn(Piece.COLOUR.WHITE);
  }

  setBoardOrientation(bottomColour) {
    this.#bottomColour = bottomColour;
    const topColour = bottomColour === Piece.COLOUR.WHITE
      ? Piece.COLOUR.BLACK
      : Piece.COLOUR.WHITE;

    this.#topPlayerNameElement.textContent = this.#getColourName(topColour);
    this.#bottomPlayerNameElement.textContent = this.#getColourName(bottomColour);
  }

  highlightCurrentTurn(colour) {
    this.#clearActiveHighlights();

    const activeElement = this.#getPlayerNameElement(colour);
    activeElement.classList.add("active");
  }

  addCapturedPieces(piecesAffected) {
    const capturedPieces = piecesAffected
      .filter((pieceAffect) => pieceAffect.getAffectType() === PieceAffect.AFFECT_TYPES.CAPTURE)
      .map((pieceAffect) => pieceAffect.getPiece());

    capturedPieces.forEach((piece) => {
      this.#addCapturedPiece(piece);
    });
  }

  renderCapturedPieces(capturedPieces = []) {
    this.#topCapturedPiecesElement.replaceChildren();
    this.#bottomCapturedPiecesElement.replaceChildren();
    capturedPieces.forEach(({ character, colour }) => {
      this.#addCapturedCharacter(character, colour);
    });
  }

  #addCapturedPiece(piece) {
    this.#addCapturedCharacter(piece.getCharacter(), piece.getColour());
  }

  #addCapturedCharacter(character, colour) {
    const pieceElement = document.createElement("span");
    const pieceMarkup = renderPieceMarkup(character);
    if (pieceMarkup) pieceElement.innerHTML = pieceMarkup;
    else pieceElement.textContent = character;

    this.#getCapturedPiecesContainer(colour).appendChild(pieceElement);
  }

  #getCapturedPiecesContainer(colour) {
    const isBottomColour = colour === this.#bottomColour;

    return isBottomColour
      ? this.#topCapturedPiecesElement
      : this.#bottomCapturedPiecesElement;
  }

  #getPlayerNameElement(colour) {
    return colour === this.#bottomColour
      ? this.#bottomPlayerNameElement
      : this.#topPlayerNameElement;
  }

  #clearActiveHighlights() {
    this.#topPlayerNameElement.classList.remove("active");
    this.#bottomPlayerNameElement.classList.remove("active");
  }

  #getColourName(colour) {
    return colour === Piece.COLOUR.WHITE ? "White" : "Black";
  }
}
