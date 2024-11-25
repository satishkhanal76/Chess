import FileRankFactory from "../FileRankFactory.js";
import { Command } from "./Command.js";
import PieceAffect from "./PieceAffect.js";

export class EnPassantCommand extends Command {
  #board;

  #from;
  #to;
  #takingPiecePosition;


  //keeps track of the piece that this move captures if any
  #movingPiece;
  #takingPiece;

  constructor(board, from, to) {
    super(Command.TYPES.EN_PASSANT_COMMAND);

    this.#board = board;
    this.#from = from;
    this.#to = to;
    this.#takingPiecePosition = FileRankFactory.getFileRank(
      this.#to.getCol(),
      this.#from.getRow()
    );

    this.#movingPiece = this.#board.getPiece(this.#from);
    this.#takingPiece = this.#board.getPiece(this.#takingPiecePosition);

    this.validate();

  }


  validate() {

    if(!this.#movingPiece) {
      this.setIsValid(false);
      throw new Error(`No piece found at ${this.#from}`);
    }

    if (!this.#board.isValidMove(this.#from, this.#to)) {
      this.setIsValid(false);
      throw new Error("Not a valid move!")
    }

    this.setIsValid(true);
  }

  execute() {
    super.execute();

    this.#board.movePiece(this.#movingPiece, this.#to);
    this.#board.removePiece(this.#takingPiecePosition);

    this.#movingPiece.moved(this.#from, this.#to);

    this.getPiecesAffected().push(new PieceAffect(this.#movingPiece, PieceAffect.AFFECT_TYPES.MOVE, this.#from, this.#to));
    if(this.#takingPiece)
    this.getPiecesAffected().push(new PieceAffect(this.#takingPiece, PieceAffect.AFFECT_TYPES.CAPTURE, this.#takingPiecePosition, null, this.#movingPiece));


    this.setExecuted(true);


  }

  undo() {
    super.undo();
    this.#board.movePiece(this.#movingPiece, this.#from);

    this.#board.placePiece(this.#takingPiece, this.#takingPiecePosition);
  }

  redo() {
    super.redo();
    this.#board.movePiece(this.#movingPiece, this.#to);
    this.#board.removePiece(this.#takingPiecePosition);
  }


  getTakingPiecePosition() {
    return this.#takingPiecePosition;
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
