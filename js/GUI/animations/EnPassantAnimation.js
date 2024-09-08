import Animation from "./Animation.js";

export default class EnPassantAnimation {
  #animation;
  #fromBlock;
  #toBlock;
  #command;
  #undo;
  #takingPieceBlock;

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

    this.#takingPieceBlock = board.getBlock(command.getTakingPiecePosition());
    this.#animation = new Animation(board, this.#fromBlock, this.#toBlock);
  }

  async animate() {
    const animations = [];
    animations.push(this.#animation.animate());

    if (!this.#undo && this.#command.getTakingPiece()) {
      animations.push(this.#takingPieceBlock.fadeOutText());
    } else if (this.#undo && this.#command.getTakingPiece())
      animations.push(
        this.#takingPieceBlock.fadeInText(
          this.#command.getTakingPiece().getCharacter()
        )
      );

    await Promise.all(animations);
  }
}
