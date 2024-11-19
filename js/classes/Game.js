import { Board } from "./Board.js";
import { Piece } from "./pieces/Piece.js";
import { Player } from "./players/Player.js";
import GameValidator from "./validators/GameValidator.js";
import CheckmateValidator from "./validators/CheckmateValidator.js";
import StalemateValidator from "./validators/StalemateValidator.js";
import ClassicalSet from "./board-sets/ClassicalSet.js";
import ClassicalVariant from "./variants/ClassicalVariant.js";
import TwoQueenVariant from "./variants/TwoQueenVariant.js";
import FileRankFactory from "./FileRankFactory.js";
import DeadPositionValidator from "./validators/DeadPositionValidator.js";
import TurnHandler from "./utilities/TurnHandler.js";
import ThreeFoldRepitionValidator from "./validators/ThreeFoldRepitionValidator.js";

export class Game {
  #variant;

  #board;

  #isOver = false;

  #winner;

  #validators = [];
  #isInProgress;

  #turnHandler;

  constructor(variant) {
    this.#variant = variant || new ClassicalVariant();
    this.#turnHandler = new TurnHandler();

    this.createBoard();


    this.resetGame();

    this.addValidators();

    this.#board.getMoveEventListener().addListener((event) => {
      this.#isInProgress = true;

      this.#validators.forEach((v) => v.onPieceMove(event.command));

      this.validateGame();
      this.#turnHandler.nextTurn();

      const command = event.command;

      try {
        console.log(
          command.getFrom().toString(),
          "->",
          command.getTo().toString()
        );
      } catch (err) {}
    });
  }

  addValidators() {
    this.#validators.push(new CheckmateValidator(this));
    this.#validators.push(new StalemateValidator(this));
    this.#validators.push(new DeadPositionValidator(this));
    this.#validators.push(new ThreeFoldRepitionValidator(this));
  }

  validateGame() {
    for (let i = 0; i < this.#validators.length; i++) {
      const validator = this.#validators[i];
      validator.validate(this);

      const isGameOver = validator.getIsOver();

      if (!isGameOver) continue;

      this.#isOver = true;

      const type = validator.getType();

      if (type === GameValidator.TYPES.CHECKMATE) {
        this.#winner = validator.getWinner();
      }

      console.log(this, validator);

      this.#isInProgress = false;
    }
  }

  resetGame() {
    this.#isOver = false;
    this.#winner = null;
    this.#isInProgress = false;
  }

  createBoard() {
    return (this.#board = this.#variant.getPopulatedBoard());
  }

  getPlayer(colour) {
    return this.#turnHandler.getPlayer(colour);
  }

  getPlayers() {
    return this.#turnHandler.getPlayers();
  }

  addPlayer(player) {
    this.#turnHandler.addPlayer(player)
  }


  getCurrentPlayer() {
    return this.#turnHandler.getCurrentPlayer();
  }

  getBoard() {
    return this.#board;
  }

  getWinner() {
    return this.#winner;
  }

  isOver() {
    return this.#isOver;
  }

  getIsInProgress() {
    return this.#isInProgress;
  }

  getTurnHandler() {
    return this.#turnHandler;
  }
}
