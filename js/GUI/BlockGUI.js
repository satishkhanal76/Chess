export class BlockGUI {
  #fileRank;

  #element;

  #boardGUI;

  #colour;

  #text;
  #isAnimationBlock;
  #textFadeInTime = 180;

  static BLOCK_WIDTH = 50;
  static BLOCK_HEIGHT = 50;

  constructor(fileRank, boardGUI, colour) {
    this.#fileRank = fileRank;

    this.#boardGUI = boardGUI;

    this.#colour = colour;
    this.#text = "";
    this.#isAnimationBlock = false;

    this.createElement();
    this.addEventListeners();
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

  addEventListeners() {
    this.#element.addEventListener("click", (eve) => {
      this.#boardGUI.clicked(this);
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

      fadeInElement.textContent = text;

      this.#element.append(fadeInElement);

      fadeInElement.style.animation = `zoom-in ${
        this.#textFadeInTime
      }ms cubic-bezier( 0.215, 0.61, 0.355, 1 )`;

      setTimeout(() => {
        fadeInElement.remove();
        this.setText(text);
        resolve("ANIMATION DONE");
      }, this.#textFadeInTime);
    });
  }

  async fadeOutText() {
    return new Promise((resolve, reject) => {
      const text = this.getText();
      this.setText(" ");

      const fadeOutElement = document.createElement("span");

      fadeOutElement.classList.add("fade-in-element");

      fadeOutElement.textContent = text;

      this.#element.append(fadeOutElement);

      fadeOutElement.style.animation = `zoom-out ${
        this.#textFadeInTime
      }ms cubic-bezier( 0.215, 0.61, 0.355, 1 )`;

      setTimeout(() => {
        fadeOutElement.remove();
        resolve("ANIMATION DONE");
      }, this.#textFadeInTime);
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

  setIsAnimationBlock(isAnimation) {
    this.#isAnimationBlock = isAnimation;
  }
  getIsAnimationBlock() {
    return this.#isAnimationBlock;
  }
}
