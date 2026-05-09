import Move from "../../classes/Move.js";
import { Command } from "../../classes/commands/Command.js";
import PromotionModal from "../PromotionModal.js";


export default class BoardInteractionHandler {
  #boardGUI;
  #gameGUI;
  #game;
  #board;
  #animationHandler;
  #clickedPiece;

  constructor(boardGUI, gameGUI, game, board, animationHandler) {
    this.#boardGUI = boardGUI;
    this.#gameGUI = gameGUI;
    this.#game = game;
    this.#board = board;
    this.#animationHandler = animationHandler;
  }

  async handleClick(block) {
    const currentPlayer = this.#game.getCurrentPlayer();
    const piece = this.#board.getPiece(block.getFileRank());

    if (this.#clickedPiece) {
      await this.#handleMoveSelection(block, currentPlayer);
    } else {
      this.#handlePieceSelection(block, piece, currentPlayer);
    }

    this.#boardGUI.updateCheckStyling();
  }

  async #handleMoveSelection(block, currentPlayer) {
    const move = new Move(this.#clickedPiece.getFileRank(), block.getFileRank());
    const commandType = this.#game.getCommandType(move);

    if (this.#hasUnplayedCommands()) {
      await this.#executeAllCommands();
    }

    if (commandType === Command.TYPES.PROMOTION_COMMAND) {
      const promotionModal = new PromotionModal(currentPlayer.getColour());
      const promotionPieceType = await promotionModal.askForPromotionPiece();
      move.setPromotionPieceType(promotionPieceType);
    }

    this.#boardGUI.removeValidSoptsMark();
    this.#clickedPiece = null;

    this.#gameGUI.makeMove(move);
  }

  #handlePieceSelection(block, piece, currentPlayer) {
    if (!piece) return;
    if (piece.getColour() !== currentPlayer.getColour()) return;

    this.#clickedPiece = block;

    const validMoves = this.#board.getValidMoves(piece);

    if (!validMoves || validMoves.length < 1) {
      this.#clickedPiece = null;
      return;
    }

    this.#boardGUI.showValidMoves(validMoves);
  }

  #hasUnplayedCommands() {
    const commandHandler = this.#board.getCommandHandler();
    return commandHandler.getCurrentCommandIndex() < commandHandler.getCommandIndex();
  }

  async #executeAllCommands() {
    const commandHandler = this.#board.getCommandHandler();
    let command;

    do {
      command = commandHandler.redoCommand();

      if (!command) break;

      await this.#animationHandler.animateCommand(command, false);
    } while (command);
  }
}
