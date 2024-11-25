import FileRankFactory from "../FileRankFactory.js";
import { Piece } from "../pieces/Piece.js";
import { Command } from "./Command.js";
import PieceAffect from "./PieceAffect.js";

export class CastleCommand extends Command {
  #board;
  #kingPosition;
  #rookPosition;

  #kingNewPosition;
  #rookNewPosition;

  #king;
  #rook;

  constructor(board, kingPosition, rookPosition) {
    super(Command.TYPES.CASTLE_COMMAND);

    this.#board = board;
    this.#kingPosition = kingPosition;
    this.#rookPosition = rookPosition;

    this.#king = this.#board.getPiece(this.#kingPosition);
    this.#rook = this.#board.getPiece(this.#rookPosition);

    this.#kingNewPosition = null;
    this.#rookNewPosition = null;

    this.validate();

  }

  validate() {
    if(!this.#king || !this.#rook) {
      this.setIsValid(false);
      throw new Error("No king or rook provided");
    }
    const isAValidRook = this.rooksThatCanLegallyCastle().find(r => r === this.#rook);
    if(!isAValidRook) {
      this.setIsValid(false);
      throw new Error("Can't castle to this rook!")
    };


    const pathToKing = this.#rook.pathToKing(this.#board);

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

    this.setIsValid(true);

  }

  execute() {
    super.execute();
    
    this.#board.movePiece(this.#king, this.#kingNewPosition);
    this.#board.movePiece(this.#rook, this.#rookNewPosition);
    
    this.#king.moved(this.#kingPosition, this.#kingNewPosition);
    this.#king.moved(this.#rookPosition, this.#rookNewPosition);
    
    this.getPiecesAffected().push(new PieceAffect(this.#king, PieceAffect.AFFECT_TYPES.MOVE, this.#kingPosition, this.#kingNewPosition));
    this.getPiecesAffected().push(new PieceAffect(this.#rook, PieceAffect.AFFECT_TYPES.MOVE, this.#rookPosition, this.#rookNewPosition));
    
    
    this.setExecuted(true);
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
    super.undo();
    this.#board.movePiece(this.#king, this.#kingPosition);
    this.#board.movePiece(this.#rook, this.#rookPosition);
  }

  redo() {
    super.redo();
    this.#board.movePiece(this.#king, this.#kingNewPosition);
    this.#board.movePiece(this.#rook, this.#rookNewPosition);
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


  getMovingPiece() {
    return this.#king;
  }
}
