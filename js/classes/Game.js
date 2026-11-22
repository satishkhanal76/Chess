import { Piece } from "./pieces/Piece.js";
import GameValidator from "./validators/GameValidator.js";
import ClassicalVariant from "./variants/ClassicalVariant.js";
import TurnHandler from "./utilities/TurnHandler.js";
import { Command } from "./commands/Command.js";
import { CastleCommand } from "./commands/CastleCommand.js";
import { PromotionCommand } from "./commands/PromotionCommand.js";
import { EnPassantCommand } from "./commands/EnPassantCommand.js";
import { MoveCommand } from "./commands/MoveCommand.js";
import { PieceFactory } from "./pieces/PieceFactory.js";
import Listeners from "./Listeners.js";
import GameState from "./position/GameState.js";
import { INITIAL_FEN } from "./position/FenPosition.js";
import PositionHistory from "./position/PositionHistory.js";
import FileRankFactory from "./FileRankFactory.js";
import DeadPositionValidator from "./validators/DeadPositionValidator.js";
import SanNotation from "./notation/SanNotation.js";
import PgnExporter from "./notation/PgnExporter.js";
import Move from "./Move.js";

export class Game {
  #variant;

  #board;

  #isOver = false;

  #winner;

  #gameValidators = [];
  #isInProgress;

  #turnHandler;

  #moveEventListeners;
  #resultEventListeners;
  #gameState;
  #positionHistory;
  #commandSnapshots = new WeakMap();
  #drawReason = null;
  #drawOffer = null;
  #result = null;
  #clock = null;
  #moveRecords = [];


  constructor(variant, fen = undefined) {
    this.#variant = variant || new ClassicalVariant();
    const variantBoard = this.#variant.getBoard();
    const dimensions = {
      rows: variantBoard.getRow(),
      columns: variantBoard.getColumn(),
    };
    if (fen) this.#variant.setStartingFen?.(fen);
    const isClassical = !this.#variant.getVariantName || this.#variant.getVariantName() === "classical";
    const defaultFen = isClassical
      ? (this.#variant.getStartingFen?.() || INITIAL_FEN)
      : `${Array(dimensions.rows).fill(dimensions.columns).join("/")} w ${this.#variant.getStartingCastlingRights?.() || "-"} - 0 1`;
    this.#gameState = new GameState(fen || defaultFen, dimensions);
    this.#positionHistory = new PositionHistory();
    this.#turnHandler = new TurnHandler();
    this.#moveEventListeners = new Listeners();
    this.#resultEventListeners = new Listeners();

    this.createBoard();
    this.#gameState.applyToBoard(this.#board);
    this.#gameState.placement = this.#board.getPositionAsString();
    this.#positionHistory.record(this.getPositionKey());

    this.resetGame();

    this.addGameValidators();
  }

  addGameValidators() {
    this.#gameValidators = this.#variant.getGameValidators(this);
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
        this.#result = { type: "checkmate", winner: this.#winner?.getColour() || null };
      } else {
        this.#drawReason = type;
        this.#result = { type: "draw", reason: type, winner: null };
      }

      this.#isInProgress = false;
      this.#clock?.stop?.();
      break;
    }
    if (this.#isOver) this.#resultEventListeners.emit(this.#result);
  }

  movePiece(requestedMove) {
    this.#clock?.refresh?.();
    if (this.#isOver) throw new Error("The game is already over.");
    // Check to see if the piece exists
    const fromPiece = this.#board.getPiece(requestedMove.getFrom());

    if(!fromPiece) throw new Error(`No Piece found at ${requestedMove.getFrom()}!`);


    //check to see if the player is the valid one
    if(!this.#isPlayerValid(requestedMove)) throw new Error(`This move can't be played by this player!`);


    const movingColour = this.#turnHandler.getCurrentPlayer().getColour();
    const previousDrawOffer = this.#drawOffer;
    if (this.#drawOffer && this.#drawOffer !== movingColour) this.#drawOffer = null;

    //get the command assciated with the move
    const command = this.#getCommand(requestedMove);
    const before = this.#captureGameSnapshot(command);
    before.drawOffer = previousDrawOffer;
    const san = SanNotation.formatBeforeMove(this.#board, command);

    //execute the command if it is valid
    if(!command.isValid()) throw new Error("Not a valid command!");
    
    command.execute();
    this.#board.getCommandHandler().addCommand(command);
    this.#gameState.updateAfterMove(command, this.#board, movingColour);
    this.#turnHandler.nextTurn();

    this.#positionHistory.record(this.getPositionKey());
    const moveRecord = {
      moveNumber: before.gameState.fullmoveNumber,
      colour: movingColour,
      san: SanNotation.addCheckSuffix(this.#board, san, movingColour),
    };
    this.#moveRecords.push(moveRecord);

    //Validate if the game is over
    this.validateGame();

    const after = this.#captureGameSnapshot(command);
    this.#commandSnapshots.set(command, { before, after });
    if (!this.#isOver) this.#clock?.switchTurn?.(this.#turnHandler.getCurrentPlayer().getColour().toLowerCase());


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
    const command = commandHandler.undoCommand();
    if (!command) return null;
    const snapshot = this.#commandSnapshots.get(command)?.before;
    if (!snapshot) return command;
    this.#restoreGameSnapshot(snapshot);
    this.#restorePieceStates(command, snapshot.pieceStates);
    this.#turnHandler.setCurrentPlayerColour(this.#gameState.activeColour === "w" ? Piece.COLOUR.WHITE : Piece.COLOUR.BLACK);
    return command;
  }

  redoMove() {
    const commandHandler = this.#board.getCommandHandler();
    const command = commandHandler.redoCommand();
    if (!command) return null;
    const snapshot = this.#commandSnapshots.get(command)?.after;
    if (!snapshot) return command;
    this.#restoreGameSnapshot(snapshot);
    this.#restorePieceStates(command, snapshot.pieceStates);
    this.#turnHandler.setCurrentPlayerColour(this.#gameState.activeColour === "w" ? Piece.COLOUR.WHITE : Piece.COLOUR.BLACK);
    return command;
  }

  #getCommand(requestedMove) {

    const from = requestedMove.getFrom(), to = requestedMove.getTo();
    const fromPiece = this.#board.getPiece(from);

    if(!fromPiece) throw new Error("No piece exists at the source square.");

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
    this.#drawReason = null;
    this.#drawOffer = null;
    this.#result = null;
    this.#isInProgress = this.#turnHandler.getPlayers().length >= 2;
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
    this.#turnHandler.addPlayer(player);
    if (this.#turnHandler.getPlayers().length === 2) {
      this.#turnHandler.setCurrentPlayerColour(this.#gameState.activeColour === "w" ? Piece.COLOUR.WHITE : Piece.COLOUR.BLACK);
      this.#isInProgress = true;
    }
  }

  getCurrentPlayer() {
    return this.#turnHandler.getCurrentPlayer();
  }

  getVariant() {
    return this.#variant;
  }

  createCopy() {
    if (typeof this.#variant.createCopy !== "function") {
      throw new Error(`Variant '${this.#variant.getVariantName?.() || "unknown"}' cannot be copied for search.`);
    }
    return new Game(this.#variant.createCopy(), this.getFen());
  }

  getFen() {
    return this.#gameState.getFen(this.#board);
  }

  getHalfmoveClock() {
    return this.#gameState.halfmoveClock;
  }

  getFullmoveNumber() {
    return this.#gameState.fullmoveNumber;
  }

  getPositionHistory() {
    return this.#positionHistory;
  }

  getLegalMoves(colour = this.#turnHandler.getCurrentPlayer()?.getColour()) {
    if (!colour) return [];
    const moves = [];
    for (const piece of this.#board.getAllColouredPieces(colour)) {
      const from = this.#board.getPiecePosition(piece);
      for (const destination of this.#board.getValidMoves(piece)) {
        const to = FileRankFactory.getFileRank(destination.col, destination.row);
        if (piece.getType() === Piece.TYPE.PAWN && piece.getPromotionRow() === to.getRow()) {
          for (const type of [Piece.TYPE.QUEEN, Piece.TYPE.ROOK, Piece.TYPE.BISHOP, Piece.TYPE.KNIGHT]) {
            moves.push(new Move(from, to, { promotionPieceType: type }));
          }
        } else {
          moves.push(new Move(from, to));
        }
      }
    }

    const king = this.#board.getKingByColour(colour);
    if (king) {
      const kingPosition = this.#board.getPiecePosition(king);
      for (const rook of this.#board.getPiecesByTypeAndColour(Piece.TYPE.ROOK, colour)) {
        const rookPosition = this.#board.getPiecePosition(rook);
        try {
          new CastleCommand(this.#board, kingPosition, rookPosition);
          moves.push(new Move(kingPosition, rookPosition));
        } catch {
          // An unavailable castle is simply omitted from the legal move list.
        }
      }
    }
    return moves;
  }

  getPositionKey() {
    const ep = this.#board.getEnPassantTarget();
    let epIsAvailable = false;
    if (ep) {
      const side = this.#gameState.activeColour === "w" ? Piece.COLOUR.WHITE : Piece.COLOUR.BLACK;
      const target = FileRankFactory.getFileRank(ep);
      epIsAvailable = this.#board.getPiecesByTypeAndColour(Piece.TYPE.PAWN, side).some((pawn) =>
        this.#board.getValidMoves(pawn).some((move) => move.col === target.getCol() && move.row === target.getRow())
      );
    }
    return this.#gameState.getPositionKey(this.#board, epIsAvailable);
  }

  canClaimDraw() {
    return this.#positionHistory.count(this.getPositionKey()) >= 3 || this.#gameState.halfmoveClock >= 100;
  }

  claimDraw(colour = this.#turnHandler.getCurrentPlayer()?.getColour(), intendedMove = null) {
    if (this.#isOver) return false;
    if (colour !== this.#turnHandler.getCurrentPlayer()?.getColour()) return false;
    let reason = null;
    if (this.#positionHistory.count(this.getPositionKey()) >= 3) {
      reason = GameValidator.TYPES.DRAW_BY_REPITION;
    } else if (this.#gameState.halfmoveClock >= 100) {
      reason = GameValidator.TYPES.DRAW_BY_FIFTY_MOVE;
    } else if (intendedMove) {
      reason = this.#claimReasonAfterIntendedMove(intendedMove);
    }
    if (!reason) return false;
    this.#drawReason = reason;
    this.#endAsDraw(this.#drawReason);
    return true;
  }

  #claimReasonAfterIntendedMove(intendedMove) {
    if (!intendedMove?.getFrom || !intendedMove?.getTo) return null;
    const piece = this.#board.getPiece(intendedMove.getFrom());
    if (!piece || piece.getColour() !== this.#turnHandler.getCurrentPlayer()?.getColour()) return null;
    let command;
    try {
      command = this.#getCommand(intendedMove);
    } catch {
      return null;
    }
    if (!command.isValid()) return null;
    const preState = this.#gameState.snapshot();
    const pieceStates = new Map();
    this.#captureCommandPieceStates(command, pieceStates);
    try {
      command.execute();
      this.#gameState.updateAfterMove(command, this.#board, piece.getColour());
      if (this.#positionHistory.count(this.getPositionKey()) >= 2) {
        return GameValidator.TYPES.DRAW_BY_REPITION;
      }
      if (this.#gameState.halfmoveClock >= 100) {
        return GameValidator.TYPES.DRAW_BY_FIFTY_MOVE;
      }
      return null;
    } finally {
      if (command.isExecuted()) command.undo();
      for (const [movedPiece, state] of pieceStates) movedPiece.restoreMovementState(state);
      this.#gameState.restore(preState);
      this.#gameState.applyToBoard(this.#board);
    }
  }

  offerDraw(colour = this.#turnHandler.getCurrentPlayer()?.getColour()) {
    if (this.#isOver || this.#drawOffer || !this.#turnHandler.getPlayers().some((player) => player.getColour() === colour)) return false;
    this.#drawOffer = colour;
    return true;
  }

  acceptDraw(colour = this.#drawOffer === Piece.COLOUR.WHITE ? Piece.COLOUR.BLACK : Piece.COLOUR.WHITE) {
    if (this.#isOver || !this.#drawOffer || colour === this.#drawOffer) return false;
    this.#endAsDraw(GameValidator.TYPES.DRAW_BY_AGREEMENT);
    return true;
  }

  declineDraw(colour = this.#drawOffer === Piece.COLOUR.WHITE ? Piece.COLOUR.BLACK : Piece.COLOUR.WHITE) {
    if (!this.#drawOffer || colour === this.#drawOffer) return false;
    this.#drawOffer = null;
    return true;
  }

  getDrawOffer() {
    return this.#drawOffer;
  }

  resign(colour = this.#turnHandler.getCurrentPlayer()?.getColour(), reason = "resignation") {
    if (this.#isOver || !colour) return false;
    const opponent = this.#turnHandler.getPlayers().find((player) => player.getColour() !== colour);
    if (!this.#turnHandler.getPlayers().some((player) => player.getColour() === colour)) return false;
    this.#winner = opponent || null;
    this.#isOver = true;
    this.#isInProgress = false;
    this.#result = { type: "resignation", winner: opponent?.getColour() || null, reason };
    this.#clock?.stop?.();
    this.#resultEventListeners.emit(this.#result);
    return true;
  }

  applyRemoteResult(result) {
    if (this.#isOver || !result || typeof result.type !== "string") return false;
    const winner = result.winner ? this.#turnHandler.getPlayer(result.winner) : null;
    if (result.winner && !winner) return false;
    this.#winner = winner;
    this.#drawReason = result.reason || null;
    this.#result = { ...result };
    this.#isOver = true;
    this.#isInProgress = false;
    this.#clock?.stop?.();
    this.#resultEventListeners.emit(this.#result);
    return true;
  }

  flagFall(colour) {
    if (this.#isOver) return false;
    const winnerColour = colour === Piece.COLOUR.WHITE ? Piece.COLOUR.BLACK : Piece.COLOUR.WHITE;
    const winner = this.#turnHandler.getPlayer(winnerColour);
    if (this.#isDeadPosition()) {
      this.#endAsDraw(GameValidator.TYPES.DRAW_BY_DEADPOSITION);
    } else {
      this.#winner = winner || null;
      this.#isOver = true;
      this.#isInProgress = false;
      this.#result = { type: "timeout", winner: winnerColour };
      this.#clock?.stop?.();
      this.#resultEventListeners.emit(this.#result);
    }
    return true;
  }

  setClock(clock, onFlag = (colour) => this.flagFall(colour.toUpperCase())) {
    this.#clock?.stop?.();
    this.#clock = clock;
    this.#clock?.setOnFlag?.(onFlag);
    return this.#clock;
  }

  startClock() {
    const colour = this.#turnHandler.getCurrentPlayer()?.getColour();
    if (colour) this.#clock?.start?.(colour.toLowerCase());
  }

  getClock() {
    return this.#clock;
  }

  getDrawReason() {
    return this.#drawReason;
  }

  getResult() {
    return this.#result;
  }

  setImportedResult(resultToken) {
    if (this.#isOver || !["1-0", "0-1", "1/2-1/2", "*"].includes(resultToken)) return false;
    if (resultToken === "*") return true;
    if (resultToken === "1/2-1/2") {
      this.#endAsDraw(GameValidator.TYPES.DRAW_BY_AGREEMENT);
      return true;
    }
    const colour = resultToken === "1-0" ? Piece.COLOUR.WHITE : Piece.COLOUR.BLACK;
    this.#winner = this.#turnHandler.getPlayer(colour) || null;
    this.#isOver = true;
    this.#isInProgress = false;
    this.#result = { type: "pgn-result", winner: colour };
    return true;
  }

  getMoveRecords() {
    return this.#moveRecords.map((record) => ({ ...record }));
  }

  getPgn(headers = {}) {
    return PgnExporter.export(this.#moveRecords, this.#result, headers);
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

  get resultEventListeners() {
    return this.#resultEventListeners;
  }

  #endAsDraw(reason) {
    this.#drawReason = reason;
    this.#isOver = true;
    this.#isInProgress = false;
    this.#winner = null;
    this.#result = { type: "draw", reason, winner: null };
    this.#clock?.stop?.();
    this.#resultEventListeners.emit(this.#result);
  }

  #isDeadPosition() {
    return DeadPositionValidator.isDeadPosition(this.#board);
  }

  #captureGameSnapshot(command = this.#board.getCommandHandler().getCurrentCommand()) {
    const pieceStates = new Map();
    if (command) this.#captureCommandPieceStates(command, pieceStates);
    return {
      gameState: this.#gameState.snapshot(),
      positions: this.#positionHistory.snapshot(),
      isOver: this.#isOver,
      winner: this.#winner,
      isInProgress: this.#isInProgress,
      drawReason: this.#drawReason,
      drawOffer: this.#drawOffer,
      result: this.#result,
      moveRecords: this.#moveRecords.map((record) => ({ ...record })),
      pieceStates,
    };
  }

  #captureCommandPieceStates(command, into) {
    for (const piece of [command.getMovingPiece?.(), command.getKing?.(), command.getRook?.()]) {
      if (piece && !into.has(piece)) into.set(piece, piece.getMovementState());
    }
  }

  #restorePieceStates(command, pieceStates) {
    const pieces = new Map();
    this.#captureCommandPieceStates(command, pieces);
    for (const piece of pieces.keys()) {
      if (pieceStates.has(piece)) piece.restoreMovementState(pieceStates.get(piece));
    }
  }

  #restoreGameSnapshot(snapshot) {
    this.#gameState.restore(snapshot.gameState);
    this.#gameState.applyToBoard(this.#board);
    this.#positionHistory.restore(snapshot.positions);
    this.#isOver = snapshot.isOver;
    this.#winner = snapshot.winner;
    this.#isInProgress = snapshot.isInProgress;
    this.#drawReason = snapshot.drawReason;
    this.#drawOffer = snapshot.drawOffer;
    this.#result = snapshot.result;
    this.#moveRecords = snapshot.moveRecords.map((record) => ({ ...record }));
    this.#clock?.pause?.();
  }
}
