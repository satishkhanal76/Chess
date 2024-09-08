import { Board } from "../Board.js";
import { CastleCommand } from "../commands/CastleCommand.js";
import { EnPassantCommand } from "../commands/EnPassantCommand.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { PromotionCommand } from "../commands/PromotionCommand.js";
import { Piece } from "../pieces/Piece.js";
import { PieceFactory } from "../pieces/PieceFactory.js";

export class Player {
  #board;

  #color;
  #pieces;

  #takenPieces;

  constructor(board, color) {
    this.#board = board;

    this.#color = color;
    this.#pieces = [];
    this.#takenPieces = [];

    this.getPieces();
  }

  getValidMoves(piece) {
    if (piece.getColour() !== this.getColour()) return [];

    return this.#board.getValidMoves(piece);
  }

  /**
   * Moves the piece on the board
   */
  movePiece(piece, toFileRank) {
    if (!piece || !toFileRank)
      throw new Error("Piece or destination file rank missing.");
    //if not our piece then return
    if (piece.getColour() !== this.getColour()) return false;

    let fromFileRank = this.#board.getPiecePosition(piece);

    let command;

    // It is an en-passant move
    if (
      piece.getType() === Piece.TYPE.PAWN &&
      fromFileRank.getCol() !== toFileRank.getCol() &&
      !this.#board.getPiece(toFileRank)
    ) {
      command = new EnPassantCommand(this.#board, fromFileRank, toFileRank);
    } else {
      command = new MoveCommand(this.#board, fromFileRank, toFileRank);
    }

    command.execute();

    if (command.isAValidCommand()) {
      this.#board.getCommandHandler().addCommand(command);
    } else {
      //if not valid than it will automatically undo the command so can just remove it
      this.#board.getCommandHandler().removeCommand(command);
    }
    let takenPiece;
    takenPiece = command.getTakingPiece();
    if (command.isAValidCommand() && takenPiece) {
      this.#takenPieces.push(takenPiece);
    }

    return command;
  }

  promotePiece(piece, to, pieceType) {
    //if not our piece then return
    if (piece.getColour() !== this.getColour()) return false;
    let from = this.#board.getPiecePosition(piece);

    if (to.getRow() != piece.getPromotionRow()) return false;

    let promotionPiece = PieceFactory.getPiece(pieceType, this.getColour());
    const command = new PromotionCommand(this.#board, from, to, promotionPiece);

    command.execute();

    if (command.isAValidCommand()) {
      this.#board.getCommandHandler().addCommand(command);
    }
    // this.#board.getCommandHandler().executeNextCommand();

    let takenPiece;
    takenPiece = command.getTakingPiece();
    if (command.isAValidCommand() && takenPiece) {
      this.#takenPieces.push(takenPiece);
    }

    return command;
  }

  castle(kingPos, rookPos) {
    let rook = this.#board.getPiece(rookPos);
    if (!rook) return false;

    let legalRooksThatCanCastle = this.rooksThatCanLegallyCastle();

    let canCastle = legalRooksThatCanCastle.find((r) => r === rook);

    if (!canCastle) return false;

    let command = new CastleCommand(this.#board, kingPos, rookPos);

    this.#board.getCommandHandler().addCommand(command);
    this.#board.getCommandHandler().executeNextCommand();

    return command;
  }

  /**
   * Finds and returns all rooks that can be castled with the king
   */
  rooksThatCanLegallyCastle() {
    let king = this.findKing();

    //if the king has moved or is in check(no legal castles)
    if (king.hasMoved() || this.isInCheck()) return [];

    let rooks = this.findPieces(Piece.TYPE.ROOK);
    let legalRooks = [];

    for (let i = 0; i < rooks.length; i++) {
      const rook = rooks[i];
      if (rook.hasMoved()) continue;

      const pathToKing = rook.pathToKing(this.#board);
      if (!pathToKing) continue;

      let spotsUnderAttackByEnemy = this.getSpotsUnderAttackByEnemies();

      let spotUnderAttack = false;
      pathToKing.forEach((spot) => {
        let onSpot = spotsUnderAttackByEnemy.filter(
          (move) => spot.col == move.col && spot.row == move.row
        );
        if (onSpot.length >= 1) {
          spotUnderAttack = true;
        }
      });
      if (spotUnderAttack) continue;

      legalRooks.push(rook);
    }
    return legalRooks;
  }

  getSpotsUnderAttackByEnemies() {
    const allPiecesOnTheBoard = this.#board.getAllPieces();
    const enemyPieces = Board.filterOutColouredPieces(
      allPiecesOnTheBoard,
      this.getColour()
    );
    let spotsUnderAttackByEnemy = [];

    enemyPieces.forEach((piece) => {
      spotsUnderAttackByEnemy = spotsUnderAttackByEnemy.concat(
        this.#board.getValidMoves(piece)
      );
    });
    return spotsUnderAttackByEnemy;
  }

  isInCheck() {
    return this.#board.isKingInCheck(this.getColour());
  }

  isInCheckMate() {
    return this.#board.isInCheckmate(this.getColour());
  }

  isInStaleMate() {
    return false;
  }
  /**
   * Finds and returns the king
   * @returns
   */
  findKing() {
    return this.findPiece(Piece.TYPE.KING);
  }

  /**
   * Finds returns the first piece that matches the type
   * @param {*} pieceType
   * @returns
   */
  findPiece(pieceType) {
    let pieces = this.findPieces(pieceType);
    if (pieces.length >= 1) return pieces[0];
    return null;
  }

  /**
   * Finds and returns all pieces that match the type
   */
  findPieces(pieceType) {
    this.getPieces();
    return this.#pieces.filter((piece) => piece.getType() === pieceType);
  }

  /**
   * Returns all pieces that are on the board that is of this player colour
   */
  getPieces() {
    this.#pieces = this.#board.getAllColouredPieces(this.#color);
    return this.#pieces;
  }

  getColour() {
    return this.#color;
  }

  getTakenPieces() {
    return this.#takenPieces;
  }
}
