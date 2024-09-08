import Animation from "./Animation.js";

export default class CastleAnimation {
  #kingAnimation;
  #rookAnimation;
  #kingFromBlock;
  #kingToBlock;
  #rookFromBlock;
  #rookToBlock;

  constructor(board, command, undo) {
    if (undo) {
      this.#kingFromBlock = board.getBlock(command.getKingNewPosition());
      this.#kingToBlock = board.getBlock(command.getKingPosition());
      this.#rookFromBlock = board.getBlock(command.getRookNewPosition());
      this.#rookToBlock = board.getBlock(command.getRookPosition());
    } else {
      this.#kingFromBlock = board.getBlock(command.getKingPosition());
      this.#kingToBlock = board.getBlock(command.getKingNewPosition());
      this.#rookFromBlock = board.getBlock(command.getRookPosition());
      this.#rookToBlock = board.getBlock(command.getRookNewPosition());
    }

    this.#kingAnimation = new Animation(
      board,
      this.#kingFromBlock,
      this.#kingToBlock
    );
    this.#rookAnimation = new Animation(
      board,
      this.#rookFromBlock,
      this.#rookToBlock
    );
  }

  async animate() {
    return Promise.all([
      this.#kingAnimation.animate(),
      this.#rookAnimation.animate(),
    ]);
  }
}
