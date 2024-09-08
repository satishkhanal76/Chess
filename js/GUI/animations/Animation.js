import { BlockGUI } from "../BlockGUI.js";

export default class Animation {
  static ANIMATION_TIME = 300;
  #board;
  #fromBlock;
  #toBlock;

  #animationBlock;

  constructor(board, fromBlock, toBlock) {
    this.#board = board;
    this.#fromBlock = fromBlock;
    this.#toBlock = toBlock;

    this.#animationBlock = new BlockGUI(
      this.#fromBlock.getFileRank(),
      this.#fromBlock.getColour()
    );

    this.setupAnimationBlock();
  }

  setupAnimationBlock() {
    const animationElement = this.#animationBlock.getElement();
    const offset = this.getAnimationOffset();
    this.setAnimationOffset(offset, animationElement);

    //more styling
    animationElement.style.backgroundColor = "transparent";
    animationElement.classList.add("animation-block");

    if (this.#board.isFlipped()) {
      animationElement.classList.add("flipped");
    }

    this.#animationBlock.setText(this.#fromBlock.getText());
  }

  //returns where in the board should the animation block start and end up
  getAnimationOffset() {
    const fromFileRank = this.#fromBlock.getFileRank();
    const toFileRank = this.#toBlock.getFileRank();
    const fromElement = this.#fromBlock.getElement();
    const toElement = this.#toBlock.getElement();

    console.dir(fromElement);

    const offsetFrom = {
      col: fromFileRank.getCol() * fromElement.offsetWidth,
      row: fromFileRank.getRow() * fromElement.offsetHeight,
    };
    const offsetTo = {
      col: toFileRank.getCol() * toElement.offsetWidth,
      row: toFileRank.getRow() * toElement.offsetHeight,
    };

    return {
      offsetFrom,
      offsetTo,
    };
  }

  // sets the given offset to the element
  setAnimationOffset(offset, element) {
    const { offsetFrom, offsetTo } = offset;
    element.style.setProperty("--from-col", offsetFrom.col + "px");
    element.style.setProperty("--from-row", offsetFrom.row + "px");
    element.style.setProperty("--to-col", offsetTo.col + "px");
    element.style.setProperty("--to-row", offsetTo.row + "px");
  }

  onAnimationStart() {
    this.#board.unHightLightFileRank();
    this.#board.hightLightFileRank(this.#fromBlock.getFileRank());

    this.#fromBlock.setText(" ");
    this.#board.getElement().append(this.#animationBlock.getElement());
  }

  onAnimationEnd() {
    this.#toBlock.setText(this.#animationBlock.getText());
    this.#animationBlock.getElement().remove();
    this.#board.updateCheckStyling();
  }

  async animate() {
    return new Promise(async (resolve, reject) => {
      this.onAnimationStart();

      this.#toBlock.fadeOutText();

      this.#animationBlock
        .getElement()
        .addEventListener("animationend", (eve) => {
          if (eve.animationName !== "animate-move") return;

          this.onAnimationEnd();

          resolve({});
        });

      this.#animationBlock.getElement().style.animation = `animate-move ${Animation.ANIMATION_TIME}ms forwards`;
    });
  }

  getAnimationBlock() {
    return this.#animationBlock;
  }
}
