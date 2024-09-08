import { Command } from "../../classes/commands/Command.js";
import CastleAnimation from "./CastleAnimation.js";
import EnPassantAnimation from "./EnPassantAnimation.js";
import MoveAnimation from "./MoveAnimation.js";
import PromotionAnimation from "./PromotionAnimation.js";

export default class AnimationHandler {
  #board;
  #activeAnimation;
  #isAnimationInProgress;
  constructor(board) {
    this.#board = board;
    this.#isAnimationInProgress = false;
  }

  async animateCommand(command, undo = false) {
    if (!command) return this.#activeAnimation;

    this.#isAnimationInProgress = true;

    switch (command.getType()) {
      case Command.TYPES.MOVE_COMMAND:
        this.#activeAnimation = new MoveAnimation(this.#board, command, undo);
        break;
      case Command.TYPES.EN_PASSANT_COMMAND:
        this.#activeAnimation = new EnPassantAnimation(
          this.#board,
          command,
          undo
        );
        break;
      case Command.TYPES.CASTLE_COMMAND:
        this.#activeAnimation = new CastleAnimation(this.#board, command, undo);
        break;
      case Command.TYPES.PROMOTION_COMMAND:
        this.#activeAnimation = new PromotionAnimation(
          this.#board,
          command,
          undo
        );
        break;
      default:
        this.#board.updateBoard();
        break;
    }

    await this.#activeAnimation.animate();
    this.#isAnimationInProgress = false;
    return this.#activeAnimation;
  }

  getActiveAnimation() {
    return this.#activeAnimation;
  }

  getIsAnimationInProgress() {
    return this.#isAnimationInProgress;
  }
}
