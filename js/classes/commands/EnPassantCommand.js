import FileRankFactory from "../FileRankFactory.js";
import { Command } from "./Command.js";

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

    this.#movingPiece = null;
    this.#takingPiece = null;

  }

  execute() {
    this.setExecuted(true);

    this.#movingPiece = this.#board.getPiece(this.#from);

    this.#takingPiece = this.#board.getPiece(this.#takingPiecePosition);

    if (!this.#movingPiece) {
      return (this.setIsValid(false));
    }

    if (!this.#board.isValidMove(this.#from, this.#to)) {
      return (this.setIsValid(false));
    }

    // console.log(this.#takingPiecePosition, this.#takingPiece);

    this.#board.movePiece(this.#movingPiece, this.#to);
    this.#board.removePiece(this.#takingPiecePosition);

    this.#movingPiece.moved(this.#from, this.#to);
    this.emit();

    return (this.setIsValid(true));
  }

  undo() {
    this.#board.movePiece(this.#movingPiece, this.#from);

    this.#board.placePiece(this.#takingPiece, this.#takingPiecePosition);
  }

  redo() {
    this.#board.movePiece(this.#movingPiece, this.#to);
    this.#board.removePiece(this.#takingPiecePosition);
  }

  emit() {
    this.#board.getMoveEventListener().emit({
      command: this,
    });
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
