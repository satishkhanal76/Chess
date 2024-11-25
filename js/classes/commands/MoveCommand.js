import { Command } from "./Command.js";
import PieceAffect from "./PieceAffect.js";

export class MoveCommand extends Command {
  #board;

  #from;
  #to;

  //keeps track of the piece that this move captures if any
  #movingPiece;
  #takingPiece;

  

  constructor(board, from, to) {
    super(Command.TYPES.MOVE_COMMAND);

    this.#board = board;
    this.#from = from;
    this.#to = to;

    this.#movingPiece = this.#board.getPiece(this.#from);
    this.#takingPiece = this.#board.getPiece(this.#to);

    this.validate()
  }

  validate() {
    if (!this.#movingPiece) {
      this.setIsValid(false);
      throw new Error(`No Piece found at ${this.#from}`);
    }

    if (!this.#board.isValidMove(this.#from, this.#to)) {
      this.setIsValid(false);
      throw new Error ("Not a valid move!");
    }

    this.setIsValid(true);
  }


  execute() {
    super.execute();

    this.#board.movePiece(this.#movingPiece, this.#to);
    this.#movingPiece.moved(this.#from, this.#to);

    this.getPiecesAffected().push(new PieceAffect(this.#movingPiece, PieceAffect.AFFECT_TYPES.MOVE, this.#from, this.#to, null));

    if(this.#takingPiece)
    this.getPiecesAffected().push(new PieceAffect(this.#takingPiece, PieceAffect.AFFECT_TYPES.CAPTURE, this.#to, null, this.#movingPiece));


    this.setExecuted(true);
  }

  undo() {
    super.undo();
    this.#board.movePiece(this.#movingPiece, this.#from);
    this.#board.placePiece(this.#takingPiece, this.#to);
  }

  redo() {
    super.redo();
    this.#board.movePiece(this.#movingPiece, this.#to);
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
}
