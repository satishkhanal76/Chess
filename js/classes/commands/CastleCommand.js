import FileRankFactory from "../FileRankFactory.js";
import { Piece } from "../pieces/Piece.js";
import { Command } from "./Command.js";

export class CastleCommand extends Command {
  #board;
  #kingPosition;
  #rookPosition;

  #kingNewPosition;
  #rookNewPosition;

  #king;
  #rook;

  #isvalidCommand;

  constructor(board, kingPosition, rookPosition) {
    super(Command.TYPES.CASTLE_COMMAND);

    this.#board = board;
    this.#kingPosition = kingPosition;
    this.#rookPosition = rookPosition;

    this.#kingNewPosition = null;
    this.#rookNewPosition = null;
  }

  execute() {
    this.setExecuted(true);

    this.#king = this.#board.getPiece(this.#kingPosition);
    this.#rook = this.#board.getPiece(this.#rookPosition);

    const isAValidRook = this.rooksThatCanLegallyCastle().find(r => r === this.#rook);
    if(!isAValidRook) return false;

    let pathToKing = this.#rook.pathToKing(this.#board);
    if(!pathToKing) return false;

    let kingNewIndex = pathToKing.length - 2;
    let rookNewIndex = kingNewIndex + 1;

    this.#kingNewPosition = FileRankFactory.getFileRank(
      pathToKing[kingNewIndex].col,
      pathToKing[kingNewIndex].row
    );

    this.#rookNewPosition = FileRankFactory.getFileRank(
      pathToKing[rookNewIndex].col,
      pathToKing[rookNewIndex].row
    );

    this.#board.movePiece(this.#king, this.#kingNewPosition);
    this.#board.movePiece(this.#rook, this.#rookNewPosition);

    this.#king.moved(this.#kingPosition, this.#kingNewPosition);
    this.#king.moved(this.#rookPosition, this.#rookNewPosition);

    this.emit();

    this.#isvalidCommand = true;

    return true;
  }

  /**
   * Finds and returns all rooks that can be castled with the king
   */
  rooksThatCanLegallyCastle() {

    //if the king has moved or is in check(no legal castles)
    if (this.#king.hasMoved() || this.#board.isPieceUnderAttack(this.#king)) return [];

    let rooks = this.#board.getPiecesByTypeAndColour(Piece.TYPE.ROOK, this.#king.getColour());
    let legalRooks = [];

    for (let i = 0; i < rooks.length; i++) {
      const rook = rooks[i];
      if (rook.hasMoved()) continue;

      const pathToKing = rook.pathToKing(this.#board);
      if (!pathToKing) continue;

      let spotsUnderAttackByEnemy = this.#board.getSpotsUnderAttack(this.#king.getColour());

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

  undo() {
    this.#board.movePiece(this.#king, this.#kingPosition);
    this.#board.movePiece(this.#rook, this.#rookPosition);
  }

  redo() {
    this.#board.movePiece(this.#king, this.#kingNewPosition);
    this.#board.movePiece(this.#rook, this.#rookNewPosition);
  }

  emit() {
    this.#board.getMoveEventListener().emit({
      command: this,
    });
  }

  getKingPosition() {
    return this.#kingPosition;
  }

  getRookPosition() {
    return this.#rookPosition;
  }

  getKingNewPosition() {
    return this.#kingNewPosition;
  }

  getRookNewPosition() {
    return this.#rookNewPosition;
  }

  getKing() {
    return this.#king;
  }

  getRook() {
    return this.#rook;
  }

  isAValidCommand() {
    return this.#isvalidCommand;
  }

  getMovingPiece() {
    return this.#king;
  }
}
