import { Command } from "./Command.js";

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

    this.#kingNewPosition = null;
    this.#rookNewPosition = null;
  }

  execute() {
    this.#king = this.#board.getPiece(this.#kingPosition);
    this.#rook = this.#board.getPiece(this.#rookPosition);

    let pathToKing = this.#rook.pathToKing(this.#board);

    let kingNewIndex = pathToKing.length - 2;
    let rookNewIndex = kingNewIndex + 1;

    this.#kingNewPosition = pathToKing[kingNewIndex];
    this.#rookNewPosition = pathToKing[rookNewIndex];

    this.#board.movePiece(this.#king, this.#kingNewPosition);
    this.#board.movePiece(this.#rook, this.#rookNewPosition);

    this.#king.moved(this.#kingPosition, this.#kingNewPosition);
    this.#king.moved(this.#rookPosition, this.#rookNewPosition);

    this.#board.getMoveEventListener().emit({
      command: this,
    });

    return true;
  }

  undo() {
    this.#board.movePiece(this.#king, this.#kingPosition);
    this.#board.movePiece(this.#rook, this.#rookPosition);
  }

  redo() {
    this.#board.movePiece(this.#king, this.#kingNewPosition);
    this.#board.movePiece(this.#rook, this.#rookNewPosition);
  }
}
