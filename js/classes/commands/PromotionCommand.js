import { Command } from "./Command.js";
import PieceAffect from "./PieceAffect.js";

export class PromotionCommand extends Command {
  #board;

  #from;
  #to;


  //keeps track of the piece that this move captures if any
  #movingPiece;
  #takingPiece;
  #promotionPiece;

  constructor(board, from, to, promotionPiece) {
    super(Command.TYPES.PROMOTION_COMMAND);

    this.#board = board;
    this.#from = from;
    this.#to = to;

    this.#movingPiece = this.#board.getPiece(this.#from);
    this.#takingPiece = this.#board.getPiece(this.#to);

    this.#promotionPiece = promotionPiece;

    this.validate();
  }


  validate() {
    if(!this.#movingPiece) {
      this.setIsValid(false);
      throw new Error(`No piece found at ${this.#from}`);
    }

    if (!this.#board.isValidMove(this.#from, this.#to)) {
      this.setIsValid(false);
      throw new Error ("Not a valid move!");
    }

    this.setIsValid(true);

  }

  execute() {
    super.execute();

    //remove pieces from their place
    this.#board.removePiece(this.#from);
    this.#board.removePiece(this.#to);

    //place the promotion piece to new location
    this.#board.placePiece(this.#promotionPiece, this.#to);

    this.#movingPiece.moved(this.#from, this.#to);

    this.getPiecesAffected().push(new PieceAffect(this.#movingPiece, PieceAffect.AFFECT_TYPES.MOVE, this.#from, this.#to));
    if(this.#takingPiece)
    this.getPiecesAffected().push(new PieceAffect(this.#takingPiece, PieceAffect.AFFECT_TYPES.CAPTURE, this.#to, null, this.#movingPiece));
    this.getPiecesAffected().push(new PieceAffect(this.#movingPiece, PieceAffect.AFFECT_TYPES.REMOVE, this.#to, null, this.#movingPiece));
    this.getPiecesAffected().push(new PieceAffect(this.#promotionPiece, PieceAffect.AFFECT_TYPES.ADD, null, this.#to, this.#movingPiece));


    this.setExecuted(true);
  }

  undo() {
    super.undo();
    this.#board.removePiece(this.#to);
    this.#board.removePiece(this.#from);

    this.#board.placePiece(this.#takingPiece, this.#to);
    this.#board.placePiece(this.#movingPiece, this.#from);
  }

  redo() {
    super.redo();
    //remove pieces from their place
    this.#board.removePiece(this.#from);
    this.#board.removePiece(this.#to);

    //place the moving piece to new location
    this.#board.placePiece(this.#promotionPiece, this.#to);
  }


  getFrom() {
    return this.#from;
  }

  getTo() {
    return this.#to;
  }

  getTakingPiece() {
    return this.#takingPiece;
  }

  getMovingPiece() {
    return this.#movingPiece;
  }

  getPromotionPiece() {
    return this.#promotionPiece;
  }

  toString() {
    return JSON.stringify({
      type: this.getType(),
      from: this.#from,
      to: this.#to,
      promotionPieceType: this.#promotionPiece.getType()
    });
  }
}
