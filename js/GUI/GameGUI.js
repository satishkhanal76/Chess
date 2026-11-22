import BoardButtons from "./BoardButtons.js";
import { BoardGUI } from "./BoardGUI.js";
import AnimationHandler from "./animations/AnimationHandler.js";
import GameOverModal from "./GameOverModal.js";
import BoardSideDisplayGUI from "./BoardSideDisplayGUI.js";
import { Piece } from "../classes/pieces/Piece.js";
import GameActionsGUI from "./GameActionsGUI.js";
import MoveHistoryPanel from "./MoveHistoryPanel.js";
import FileRankFactory from "../classes/FileRankFactory.js";

export default class GameGUI {
  #game;
  #boardGUI;
  #buttonsGUI;
  #boardSideDisplayGUI;
  #gameOverModal;

  #animationHandler;
  #gameActionsGUI;
  #moveHistoryPanel;
  #timelineCommands = [];
  #timelinePositions = [];
  #timelineIndex = 0;
  #gameStarted = false;
  #isOnline = false;
  #canOnlyColourMove; //keeps track if only one colour can move

  constructor(game) {
    this.#game = game;
    this.#canOnlyColourMove = null;


    const modal = document.getElementById("modal");
    modal.style.display = "none";

    this.#animationHandler = new AnimationHandler(this);

    this.#gameOverModal = new GameOverModal(modal);


    this.#boardGUI = new BoardGUI(this);
    this.#buttonsGUI = new BoardButtons(this);
    this.#boardSideDisplayGUI = new BoardSideDisplayGUI();
    this.#gameActionsGUI = new GameActionsGUI(this.#game);
    this.#moveHistoryPanel = new MoveHistoryPanel(this.#game);
    this.#timelinePositions.push(this.#captureTimelinePosition());

    this.#addEventListeners();
    this.setGameStarted(false);
  }

  #addEventListeners() {
    this.#game.moveEventListeners.addListener((payload) => {
      this.#handleMoveAnimation(payload);
    });

    this.#game.resultEventListeners.addListener(() => {
      this.#gameOverModal.displayIfOver(this.#game);
    });
  }

  #handleMoveAnimation(payload) {
    const wasFollowingLatest = this.#timelineIndex === this.#timelineCommands.length;
    this.#timelineCommands.push(payload.command);
    const previousPosition = this.#timelinePositions.at(-1);
    const capturedPieces = [...(previousPosition?.capturedPieces || [])];
    payload.command.getPiecesAffected().forEach((effect) => {
      if (effect.getAffectType() !== "CAPTURE") return;
      const piece = effect.getPiece();
      capturedPieces.push({ character: piece.getCharacter(), colour: piece.getColour() });
    });
    this.#timelinePositions.push({ ...this.#captureTimelinePosition(), capturedPieces });

    if (wasFollowingLatest) {
      this.#timelineIndex += 1;
      this.#animationHandler.animateCommand(payload.command);
    } else {
      this.setStatus("New moves received. Select Latest to return to the game.");
    }
    this.#updateTimelinePreviewState();
    this.#buttonsGUI.updateButtons();
    this.#gameOverModal.displayIfOver(this.#game);
  }

  syncBoardAfterAnimations() {
    const position = this.#timelinePositions[this.#timelineIndex];
    if (position) {
      this.#boardGUI.renderPosition(position);
      this.#boardSideDisplayGUI.renderCapturedPieces(position.capturedPieces);
      this.#boardSideDisplayGUI.highlightCurrentTurn(position.activeColour);
    }
    this.#buttonsGUI.updateButtons();
  }

  #captureTimelinePosition() {
    const board = this.#game.getBoard();
    const pieces = Array.from({ length: board.getRow() }, (_, row) =>
      Array.from({ length: board.getColumn() }, (_, col) => {
        const piece = board.getPiece(FileRankFactory.getFileRank(col, row));
        return piece?.getCharacter() || " ";
      })
    );
    const checkedKingSquares = [Piece.COLOUR.WHITE, Piece.COLOUR.BLACK]
      .filter((colour) => board.isKingInCheck(colour))
      .map((colour) => {
        const position = board.getPiecePosition(board.getKingByColour(colour));
        return { row: position.getRow(), col: position.getCol() };
      });
    return {
      pieces,
      checkedKingSquares,
      activeColour: this.#game.getCurrentPlayer()?.getColour() || Piece.COLOUR.WHITE,
      capturedPieces: [],
    };
  }

  stepBackInTimeline() {
    if (this.#timelineIndex === 0) return;
    const command = this.#timelineCommands[this.#timelineIndex - 1];
    this.#timelineIndex -= 1;
    this.#updateTimelinePreviewState();
    this.#animationHandler.animateCommand(command, true);
    this.#buttonsGUI.updateButtons();
  }

  stepForwardInTimeline() {
    if (this.#timelineIndex >= this.#timelineCommands.length) return;
    const command = this.#timelineCommands[this.#timelineIndex];
    this.#timelineIndex += 1;
    this.#updateTimelinePreviewState();
    this.#animationHandler.animateCommand(command);
    this.#buttonsGUI.updateButtons();
  }

  followLatestInTimeline() {
    while (this.#timelineIndex < this.#timelineCommands.length) {
      const command = this.#timelineCommands[this.#timelineIndex];
      this.#timelineIndex += 1;
      this.#updateTimelinePreviewState();
      this.#animationHandler.animateCommand(command);
    }
    this.#buttonsGUI.updateButtons();
  }

  getTimelineState() {
    return { index: this.#timelineIndex, latestIndex: this.#timelineCommands.length };
  }

  #updateTimelinePreviewState() {
    this.#boardGUI.setHistoryPreview(this.#timelineIndex < this.#timelineCommands.length);
  }

  refreshMoveHistory() {
    this.#moveHistoryPanel?.update();
  }

  // Called by board gui when the user wants to make a move
  makeMove(move) {
    if (!this.#gameStarted) return;
    if (this.#isOnline) {
      const clock = this.#game.getClock();
      const currentColour = this.#game.getCurrentPlayer()?.getColour()?.toLowerCase();
      if (clock && currentColour && clock.getState()[currentColour] <= 0) return;
    }
    if (this.#timelineIndex < this.#timelineCommands.length) {
      this.setStatus("Return to the latest move before playing.");
      return;
    }
    if (!this.#canCurrentPlayerMove()) return;

    this.#tryMove(move);
  }

  #canCurrentPlayerMove() {
    return !this.#canOnlyColourMove ||
      this.#canOnlyColourMove === this.#game.getCurrentPlayer().getColour();
  }

  #tryMove(move) {
    try {
      const command = this.#game.movePiece(move);
      if (command && !command.isValid()) return;
    } catch (err) {
      console.error("Invalid command!");
    }
  }


  getBoardGUI() {
    return this.#boardGUI;
  }


  getButtonsGUI() {
    return this.#buttonsGUI;
  }

  getGame() {
    return this.#game;
  }

  getAnimationHandler() {
    return this.#animationHandler;
  }

  setCanOnlyColourMove(colour) {
    this.#canOnlyColourMove = colour;
  }

  setBoardOrientation(bottomColour) {
    this.#boardSideDisplayGUI.setBoardOrientation(bottomColour);
    this.#boardGUI.flipBoard();
    this.#gameActionsGUI.setBoardOrientation(bottomColour);
  }

  setOnlineMode(isOnline) {
    this.#isOnline = Boolean(isOnline);
    this.#gameActionsGUI.setOnlineMode(isOnline);
  }

  setOnlineActionHandlers(handlers) {
    this.#gameActionsGUI.setOnlineActionHandlers(handlers);
  }

  setOnlinePlayerColour(colour) {
    this.#gameActionsGUI.setOnlinePlayerColour(colour);
  }

  setOnlineDrawOffer(colour) {
    this.#gameActionsGUI.setOnlineDrawOffer(colour);
  }

  refreshControls() {
    this.#gameActionsGUI.update();
  }

  setGameStarted(started) {
    this.#gameStarted = Boolean(started);
    document.getElementById("board-container")?.classList.toggle("is-locked", !this.#gameStarted);
    this.#gameActionsGUI.setGameStarted(this.#gameStarted);
    if (this.#gameStarted) this.setStatus("Game in progress");
    else {
      const status = document.getElementById("game-status");
      if (status) status.hidden = true;
    }
  }

  getIsGameStarted() {
    return this.#gameStarted;
  }

  setStatus(message) {
    const status = document.getElementById("game-status");
    if (status) {
      status.textContent = message;
      status.hidden = false;
    }
  }


}
