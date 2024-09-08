import { PIECE_DATA } from "../classes/pieces/PieceFactory.js";

export default class PromotionModal {
  #modalElement;
  #pieceToBePromotedTo;
  #colour;
  #elements = [];
  constructor(colour) {
    this.#colour = colour;

    this.createModal();
  }

  createModal() {
    this.#modalElement = document.createElement("div");
    this.#modalElement.classList.add("promotion-modal");

    const promotablePieces = PIECE_DATA[this.#colour].filter((pieceData) => {
      if (pieceData.canBePromotedTo) return pieceData;
    });

    promotablePieces.forEach((pieceData) => {
      const element = document.createElement("div");
      element.classList.add("promotion-modal-item");
      element.textContent = pieceData.character;

      element.addEventListener("click", () => {
        this.#pieceToBePromotedTo = pieceData.type;
      });

      this.#modalElement.append(element);
      this.#elements.push(element);
    });
  }

  async askForPromotionPiece() {
    return new Promise((resolve, reject) => {
      document.body.appendChild(this.getElement());
      this.#elements.forEach((ele) => {
        ele.addEventListener("click", () => {
          document.body.removeChild(this.#modalElement);
          resolve(this.#pieceToBePromotedTo);
        });
      });
    });
  }

  getElement() {
    return this.#modalElement;
  }
}
