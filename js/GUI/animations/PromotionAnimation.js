import Animation from "./Animation.js";

export default class PromotionAnimation {
  static ANIMATION_TIME = 250; //animation time in milliseconds

  #animation;
  #fromBlock;
  #toBlock;
  #command;
  #undo;

  constructor(board, command, undo) {
    this.#command = command;
    this.#undo = undo;
    if (undo) {
      this.#fromBlock = board.getBlock(command.getTo());
      this.#toBlock = board.getBlock(command.getFrom());
    } else {
      this.#fromBlock = board.getBlock(command.getFrom());
      this.#toBlock = board.getBlock(command.getTo());
    }

    this.#animation = new Animation(board, this.#fromBlock, this.#toBlock);
  }

  async animate() {
    const animations = [];

    if (!this.#undo) {
      animations.push(await this.#animation.animate());

      animations.push(await this.#toBlock.fadeOutText());

      animations.push(
        this.#toBlock.fadeInText(
          this.#command.getPromotionPiece().getCharacter()
        )
      );
    } else {
      animations.push(await this.#fromBlock.fadeOutText());
      animations.push(
        await this.#fromBlock.fadeInText(
          this.#command.getMovingPiece().getCharacter()
        )
      );

      this.#animation
        .getAnimationBlock()
        .setText(this.#command.getMovingPiece().getCharacter());

      this.#animation.animate();

      animations.push(
        this.#fromBlock.fadeInText(
          this.#command.getTakingPiece().getCharacter()
        )
      );
    }

    await Promise.all(animations);
  }
}
