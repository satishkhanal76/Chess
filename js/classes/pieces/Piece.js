import FileRankFactory from "../FileRankFactory.js";

export class Piece {
  static COLOUR = {
    BLACK: "BLACK",
    WHITE: "WHITE",
  };

  static TYPE = {
    KING: "KING",
    QUEEN: "QUEEN",
    ROOK: "ROOK",
    BISHOP: "BISHOP",
    KNIGHT: "KNIGHT",
    PAWN: "PAWN",
  };

  #type;
  #character;
  #fenCharacter;
  #colour;
  #moves;

  #moved;

  constructor(type, character, colour, fenCharacter) {
    this.#type = type;
    this.#character = character;
    this.#colour = colour;
    this.#moves = [];
    this.#fenCharacter = fenCharacter;

    this.#moved = false;
  }

  getFenCharacter() {
    return this.#fenCharacter;
  }

  getAvailableMoves(board) {
    let dimension = {
      col: board.getColumn(),
      row: board.getRow(),
    };
    let piecePosition = board.getPiecePosition(this);

    let availableSpots = [];

    for (let i = 0; i < this.#moves.length; i++) {
      const move = this.#moves[i];
      let spots = move(dimension, {
        col: piecePosition.getCol(),
        row: piecePosition.getRow(),
      });

      if (!spots) continue;
      availableSpots = availableSpots.concat(
        this.checkPathForValidSpots(board, spots)
      );
    }
    return availableSpots;
  }

  checkPathForValidSpots(board, spots) {
    for (let i = 0; i < spots.length; i++) {
      let spot = spots[i];
      let pieceAtTheSpot;

      const spotFileRank = FileRankFactory.getFileRank(spot.col, spot.row);

      pieceAtTheSpot = board.getPiece(spotFileRank);

      if (!pieceAtTheSpot) continue;

      if (pieceAtTheSpot.getColour() == this.getColour()) {
        return spots.splice(0, i);
      }

      return spots.splice(0, i + 1);
    }
    return spots;
  }

  /**
     * This method is called whenever a piece is moved

     * @param {Object} from the position the piece moved from
     * @param {Object} to the position the piece moved to
     * @returns 
     */
  moved(from, to) {
    this.#moved = true;
  }

  hasMoved() {
    return this.#moved;
  }

  addMoves(move) {
    this.#moves.push(move);
  }

  getMoves() {
    return this.#moves;
  }
  clearMoves() {
    this.#moves = [];
  }

  getType() {
    return this.#type;
  }

  getColour() {
    return this.#colour;
  }

  getCharacter() {
    return this.#character;
  }
}
