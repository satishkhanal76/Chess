import { Command } from "./Command.js";

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

    this.#movingPiece = null;
    this.#takingPiece = null;

  }

  execute() {
    this.setExecuted(true);

    this.#movingPiece = this.#board.getPiece(this.#from);
    this.#takingPiece = this.#board.getPiece(this.#to);

    if (!this.#movingPiece) {
      return (this.setIsValid(false));
    }

    if (!this.#board.isValidMove(this.#from, this.#to)) {
      return (this.setIsValid(false));
    }

    this.#board.movePiece(this.#movingPiece, this.#to);
    this.#movingPiece.moved(this.#from, this.#to);
    this.emit();

    this.setIsValid(true);
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

  emit() {
    this.#board.getMoveEventListener().emit({
      command: this,
    });
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
