import FileRankFactory from "../FileRankFactory.js";
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

    let pathToKing = this.#rook.pathToKing(this.#board);

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
}
