export class BlockGUI {
  #fileRank;

  #element;

  #colour;

  #text;
  #textFadeInTime = 180;

  static BLOCK_WIDTH = 50;
  static BLOCK_HEIGHT = 50;

  constructor(fileRank, colour) {
    this.#fileRank = fileRank;

    this.#colour = colour;
    this.#text = "";

    this.createElement();
  }

  getText() {
    return this.#text;
  }

  showAsValidBlock() {
    this.#element.classList.add("valid-spot");
  }

  hideAsValidBlock() {
    this.#element.classList.remove("valid-spot");
  }

  createElement() {
    this.#element = document.createElement("div");
    this.#element.classList.add("block");
    this.#element.classList.add(this.#colour);

    this.#element.dataset.col = this.#fileRank.getCol();
    this.#element.dataset.row = this.#fileRank.getRow();
    this.setText(" ");
  }

  onClick(board) {
    this.#element.addEventListener("click", (eve) => {
      board.clicked(this);
    });
  }

  getFileRank() {
    return this.#fileRank;
  }
  setText(text) {
    this.#text = text;
    this.#element.textContent = this.#text;
  }

  async fadeInText(text) {
    return new Promise((resolve, reject) => {
      this.setText(" ");

      const fadeInElement = document.createElement("span");

      fadeInElement.classList.add("fade-in-element");

      this.#element.append(fadeInElement);

      fadeInElement.textContent = text;
      fadeInElement.style.animation = `zoom-in ${this.#textFadeInTime}ms`;

      fadeInElement.addEventListener("animationend", () => {
        this.setText(text);
        fadeInElement.remove();
        resolve("ANIMATION DONE");
      });
    });
  }

  async fadeOutText() {
    return new Promise((resolve, reject) => {
      const text = this.getText();

      const fadeOutElement = document.createElement("span");

      fadeOutElement.classList.add("fade-in-element");

      fadeOutElement.textContent = text;
      this.setText(" ");

      this.#element.append(fadeOutElement);

      fadeOutElement.style.animation = `zoom-out ${this.#textFadeInTime}ms`;

      fadeOutElement.addEventListener("animationend", () => {
        fadeOutElement.remove();
        resolve("ANIMATION DONE");
      });
    });
  }

  getElement() {
    return this.#element;
  }

  getColour() {
    return this.#colour;
  }

  addCheckStyle() {
    this.#element.classList.add("incheck");
  }

  removeCheckStyle() {
    this.#element.classList.remove("incheck");
  }
}
