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
import { Command } from "./commands/Command.js";
import { CastleCommand } from "./commands/CastleCommand.js";
import { PromotionCommand } from "./commands/PromotionCommand.js";
import { EnPassantCommand } from "./commands/EnPassantCommand.js";
import { MoveCommand } from "./commands/MoveCommand.js";
import { PieceFactory } from "./pieces/PieceFactory.js";

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

  movePiece(player, move) {
    //check to see if the current player is the player that is moving the piece
    if(player !== this.#turnHandler.getCurrentPlayer()) throw new Error("Not the players turn!");

    const from = move.getFrom(), to = move.getTo();

    const fromPiece = this.#board.getPiece(from);

    if(!fromPiece || fromPiece.getColour() !== player.getColour()) throw new Error("Can't move other players pieces.");

    let command;

    switch(this.getCommandType(move)) {
      case Command.TYPES.CASTLE_COMMAND:
        command = new CastleCommand(this.#board, from, to);
      break;

      case Command.TYPES.PROMOTION_COMMAND:
        command = new PromotionCommand(this.#board, from, to, PieceFactory.getPiece(move.getPromotionPieceType(), player.getColour()));
      break;

      case Command.TYPES.EN_PASSANT_COMMAND:
        command = new EnPassantCommand(this.#board, from, to);
      break;
      
      case Command.TYPES.MOVE_COMMAND:
        command = new MoveCommand(this.#board, from, to);
      break;

    }

    //execute the command
    command.execute();

    if(command.isAValidCommand()) {
      this.#board.getCommandHandler().addCommand(command);
    }

    return command;
  }

  getCommandType(move) {
    const from = move.getFrom();
    const to = move.getTo();

    const fromPiece = this.#board.getPiece(from);
    const toPiece = this.#board.getPiece(to);
    if (
      fromPiece?.getColour() === toPiece?.getColour() &&
      fromPiece?.getType() === Piece.TYPE.KING &&
      toPiece?.getType() === Piece.TYPE.ROOK
    ) return Command.TYPES.CASTLE_COMMAND;

    if(fromPiece.getType() === Piece.TYPE.PAWN &&
    fromPiece.getPromotionRow() === to.getRow()) return Command.TYPES.PROMOTION_COMMAND;

    if(fromPiece.getType() === Piece.TYPE.PAWN &&
    from.getCol() !== to.getCol() &&
    !this.#board.getPiece(to)) return Command.TYPES.EN_PASSANT_COMMAND;

    return Command.TYPES.MOVE_COMMAND;
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
