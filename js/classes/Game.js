import { Piece } from "./pieces/Piece.js";
import GameValidator from "./validators/GameValidator.js";
import CheckmateValidator from "./validators/CheckmateValidator.js";
import StalemateValidator from "./validators/StalemateValidator.js";
import ClassicalVariant from "./variants/ClassicalVariant.js";
import DeadPositionValidator from "./validators/DeadPositionValidator.js";
import TurnHandler from "./utilities/TurnHandler.js";
import ThreeFoldRepitionValidator from "./validators/ThreeFoldRepitionValidator.js";
import { Command } from "./commands/Command.js";
import { CastleCommand } from "./commands/CastleCommand.js";
import { PromotionCommand } from "./commands/PromotionCommand.js";
import { EnPassantCommand } from "./commands/EnPassantCommand.js";
import { MoveCommand } from "./commands/MoveCommand.js";
import { PieceFactory } from "./pieces/PieceFactory.js";
import Listeners from "./Listeners.js";

export class Game {
  #variant;

  #board;

  #isOver = false;

  #winner;

  #gameValidators = [];
  #isInProgress;

  #turnHandler;

  #moveEventListeners;


  constructor(variant) {
    this.#variant = variant || new ClassicalVariant();
    this.#turnHandler = new TurnHandler();
    this.#moveEventListeners = new Listeners();

    this.createBoard();


    this.resetGame();

    this.addGameValidators();
  }

  //TODO: variants should handle adding validators
  addGameValidators() {
    this.#gameValidators.push(new CheckmateValidator(this));
    this.#gameValidators.push(new StalemateValidator(this));
    this.#gameValidators.push(new DeadPositionValidator(this));
    this.#gameValidators.push(new ThreeFoldRepitionValidator(this));
  }

  validateGame() {
    for (let i = 0; i < this.#gameValidators.length; i++) {
      const validator = this.#gameValidators[i];
      validator.validate(this);

      const isGameOver = validator.getIsOver();

      if (!isGameOver) continue;

      this.#isOver = true;

      const type = validator.getType();

      if (type === GameValidator.TYPES.CHECKMATE) {
        this.#winner = validator.getWinner();
      }

      this.#isInProgress = false;
    }
  }

  movePiece(requestedMove) {
    // Check to see if the piece exists
    const fromPiece = this.#board.getPiece(requestedMove.getFrom());

    if(!fromPiece) throw new Error(`No Piece found at ${requestedMove.getFrom()}!`);


    //check to see if the player is the valid one
    if(!this.#isPlayerValid(requestedMove)) throw new Error(`This move can't be played by this player!`);


    //get the command assciated with the move
    const command = this.#getCommand(requestedMove);

    //execute the command if it is valid
    if(!command.isValid()) throw new Error("Not a valid command!");
    
    command.execute();
    this.#board.getCommandHandler().addCommand(command);

    //Validate if the game is over
    this.validateGame();


    //TODO: Pass the turn handler the game state to see if turn should change (don't change turn if it is over)
    this.#turnHandler.nextTurn();
    

    //emit the command to listerners
    this.#moveEventListeners.emit({
      piecesAffected: command.getPiecesAffected(),
      command: command,
      isGameOver: this.#isOver,
      winner: this.#winner,
      player: this.#turnHandler.getPreviousPlayer(),
      requestedMove: requestedMove
    })

    return command;
  }

  undoMove() {
    const commandHandler = this.#board.getCommandHandler();

    return commandHandler.undoCommand();
  }

  redoMove() {
    const commandHandler = this.#board.getCommandHandler();
    return commandHandler.redoCommand();
  }

  #getCommand(requestedMove) {

    const from = requestedMove.getFrom(), to = requestedMove.getTo();
    const fromPiece = this.#board.getPiece(from);

    if(!fromPiece || fromPiece.getColour() !== fromPiece.getColour()) throw new Error("Can't move other players pieces.");

    let command;

    switch(this.getCommandType(requestedMove)) {
      case Command.TYPES.CASTLE_COMMAND:
        command = new CastleCommand(this.#board, from, to);
      break;

      case Command.TYPES.PROMOTION_COMMAND:
        command = new PromotionCommand(this.#board, from, to, PieceFactory.getPiece(requestedMove.getPromotionPieceType(), fromPiece.getColour()));
      break;

      case Command.TYPES.EN_PASSANT_COMMAND:
        command = new EnPassantCommand(this.#board, from, to);
      break;
      
      case Command.TYPES.MOVE_COMMAND:
        command = new MoveCommand(this.#board, from, to);
      break;
    }
    return command;
  }

  #isPlayerValid(requestedMove) {
    const currentPlayer = this.#turnHandler.getCurrentPlayer();
    const requestedMovePlayer = this.#turnHandler.getPlayer(this.#board.getPiece(requestedMove.getFrom()).getColour());
    return (currentPlayer === requestedMovePlayer);
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

  get moveEventListeners() {
    return this.#moveEventListeners;
  }
}
