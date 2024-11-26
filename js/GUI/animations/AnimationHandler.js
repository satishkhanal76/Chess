import { Command } from "../../classes/commands/Command.js";
import MoveAnimation from "./MoveAnimation.js";
import EnPassantAnimation from "./EnPassantAnimation.js";
import CastleAnimation from "./CastleAnimation.js";
import PromotionAnimation from "./PromotionAnimation.js";



export default class AnimationHandler {
  static ANIMATION_MAP = {
    [Command.TYPES.MOVE_COMMAND]: MoveAnimation,
    [Command.TYPES.EN_PASSANT_COMMAND]: EnPassantAnimation,
    [Command.TYPES.CASTLE_COMMAND]: CastleAnimation,
    [Command.TYPES.PROMOTION_COMMAND]: PromotionAnimation
  }

  #gameGUI;
  #activeAnimation = null;
  #queue = []; // Animation queue
  #isAnimating = false;

  constructor(gameGUI) {
    this.#gameGUI = gameGUI;
  }

  async animateCommand(command, undo = false) {
    if (!command) return this.#activeAnimation;

    // Push the animation request into the queue
    const animationPromise = new Promise((resolve) => {
      this.#queue.push(() => this.#runAnimation(command, undo, resolve));
    });

    // Start processing the queue if not already animating
    if (!this.#isAnimating) {
      this.#processQueue();
    }

    return animationPromise;
  }

  async #runAnimation(command, undo, resolve) {
    const AnimationClass = AnimationHandler.ANIMATION_MAP[command.getType()];
    this.#activeAnimation = new AnimationClass(
      this.#gameGUI.getBoardGUI(),
      command,
      undo
    );

    await this.#activeAnimation.animate();
    this.#activeAnimation = null;
    resolve(); // Mark this animation as completed
  }

  async #processQueue() {
    this.#isAnimating = true;
    while (this.#queue.length > 0) {
      const nextAnimation = this.#queue.shift();
      await nextAnimation();
    }
    this.#isAnimating = false;
  }

  getActiveAnimation() {
    return this.#activeAnimation;
  }
}