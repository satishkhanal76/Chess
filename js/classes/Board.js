import FileRank from "./FileRank.js";
import FileRankFactory from "./FileRankFactory.js";
import Listeners from "./Listeners.js";
import MoveValidator from "./MoveValidators/MoveValidator.js";
import { CommandHandler } from "./commands/CommandHandler.js";
import { Piece } from "./pieces/Piece.js";

export class Board {
  #col;
  #row;

  #grid;

  #commandHandler;

  #moveEventListener;

  #moveValidator;

  constructor(col, row) {
    this.#col = col || 8;
    this.#row = row || 8;

    this.#createBoard();

    this.#commandHandler = new CommandHandler();
    this.#moveEventListener = new Listeners();
    this.#moveValidator = new MoveValidator(this);
  }

  #createBoard() {
    this.#grid = new Array(this.#col);
    for (let i = 0; i < this.#grid.length; i++) {
      this.#grid[i] = new Array(this.#row);
      for (let j = 0; j < this.#grid[i].length; j++) {
        this.#grid[i][j] = null;
      }
    }
  }

  /**
   * Returns all the pieces on the board
   * @returns pieces
   */
  getAllPieces() {
    let pieces = [];
    for (let i = 0; i < this.#grid.length; i++) {
      for (let j = 0; j < this.#grid[i].length; j++) {
        if (this.#grid[i][j]) pieces.push(this.#grid[i][j]);
      }
    }
    return pieces;
  }

  getPiecesAtFile(fileRank) {
    return this.getPiecesAtColumn(fileRank.getCol());
  }

  getPiecesAtRank(fileRank) {
    return this.getPiecesAtRow(fileRank.getRow());
  }

  getPiecesAtColumn(index) {
    return this.#grid[index];
  }

  getPiecesAtRow(index) {
    let pieces = [];
    for (let i = 0; i < this.#grid.length; i++) {
      pieces.push(this.#grid[i][index]);
    }
    return pieces;
  }

  /**
   * Returns all the pieces on the board that is of a colour
   * @param {string} colour the colour to return the pieces of
   * @returns
   */
  getAllColouredPieces(colour) {
    let colouredPieces = [];
    for (let i = 0; i < this.#grid.length; i++) {
      for (let j = 0; j < this.#grid[i].length; j++) {
        if (!this.#grid[i][j]) continue;

        if (this.#grid[i][j].getColour() === colour) {
          colouredPieces.push(this.#grid[i][j]);
        }
      }
    }
    return colouredPieces;
  }

  /**
   * Places a piece at a position on the board
   * @param {Piece} piece the piece to place
   * @param {Object} at the position to place the piece at
   * @returns
   */
  placePiece(piece, at) {
    if (this.#grid[at.getCol()][at.getRow()]) return;
    this.#grid[at.getCol()][at.getRow()] = piece;
  }

  /**
   * Removes a piece from the board
   * @param {Object} from the position to remove a piece from
   * @returns the piece that was removed
   */
  removePiece(from) {
    let piece = this.#grid[from.getCol()][from.getRow()];
    this.#grid[from.getCol()][from.getRow()] = null;
    return piece;
  }

  /**
   * Moves a piece from its location to the location passed in
   * @param {*} piece
   * @param {*} to
   * @returns the piece that was replaced/taken if any
   */
  movePiece(piece, to) {
    let piecePosition = this.getPiecePosition(piece);
    let takingPiece = this.removePiece(to);

    this.removePiece(piecePosition);
    this.placePiece(piece, to);

    return takingPiece;
  }

  move(from, to) {
    const piece = this.getPiece(at);
  }

  /**
   * Checks to see if moving to piece from a location to a location will put this players king at check
   * @param {*} from the location to move the piece from
   * @param {*} to the location to move the piece to
   * @returns if the move will put king in danger
   */

  willMovePutKingInCheck(from, to) {
    const fromPiece = this.removePiece(from);
    const toPiece = this.removePiece(to);

    if (!fromPiece) return true;

    const fromPieceColour = fromPiece.getColour();

    // place the piece to the move to location for check
    this.placePiece(fromPiece, to);

    const willKingBeInCheck = this.isKingInCheck(fromPieceColour);

    //revese the placing of the piece for check
    this.removePiece(to);

    //reverse to the original state of the game
    this.placePiece(fromPiece, from);
    this.placePiece(toPiece, to);

    return willKingBeInCheck;
  }

  /**
   * Returns all the valid moves for the piece
   * @param {Piece} piece the piece to get the valid moves for
   */
  getValidMoves(piece) {
    return this.#moveValidator.getValidMoves(piece);
    let validMoves;
    let to;

    let piecePosition = this.getPiecePosition(piece);

    validMoves = piece.getAvailableMoves(this);

    for (let i = validMoves.length - 1; i >= 0; i--) {
      to = validMoves[i];

      const toFileRank = FileRankFactory.getFileRank(to.col, to.row);

      //if this move puts king at risk than its not valid
      if (this.willMovePutKingInCheck(piecePosition, toFileRank)) {
        validMoves.splice(i, 1);
      }
    }
    return validMoves;
  }

  getAllValidMoves(colour) {
    const colouredPieces = this.getAllColouredPieces(colour);

    let validMoves = [];

    colouredPieces.forEach((piece) => {
      validMoves = validMoves.concat(this.getValidMoves(piece));
    });

    return validMoves;
  }

  /**
   * Checks to see if this move is valid
   * @param {*} from the location to move the piece from
   * @param {*} to the location to move the piece to
   * @returns if the move is a valid move
   */
  isValidMove(from, to) {
    const fromPiece = this.getPiece(from);

    let isAvalidPosition = false;

    // console.log(this.#commandHandler.getCurrentCommand());

    let validMoves = this.getValidMoves(fromPiece);

    for (let i = 0; i < validMoves.length; i++) {
      let move = validMoves[i];
      if (move.col === to.getCol() && move.row === to.getRow())
        isAvalidPosition = true;
    }
    return isAvalidPosition;
  }

  /**
   * Checks to see if the king with that colour is in check
   * @param {*} colour the colour of the king to check
   * @returns if the is checked
   */
  isKingInCheck(colour) {
    const king = Board.filterColouredPieces(
      this.getPiecesByType(Piece.TYPE.KING),
      colour
    ).pop();

    if (!king) return false;
    return this.isPieceUnderAttack(king);
  }

  isInCheckmate(colour) {
    if (!this.isKingInCheck(colour)) return false;
    const allValidMoves = this.getAllValidMoves(colour);
    if (allValidMoves.length < 1) return true;
    return false;
  }

  /**
   * Returns all the pieces that match a certain type
   * @param {*} type the type to get the piece by
   * @returns pieces that match the criteria
   */
  getPiecesByType(type) {
    return this.getAllPieces().filter((piece) => piece.getType() === type);
  }

  /**
   * Gets a piece from a location on the board
   * @param {FileRank} at the location to get the pice from
   * @returns piece at that location
   */
  getPiece(at) {
    return this.#grid[at.getCol()][at.getRow()];
  }

  /**
   * Return a position of the piece
   * @param {Piece} piece the piece to get the position og
   * @returns the position of the piece
   */
  getPiecePosition(piece) {
    for (let i = 0; i < this.#grid.length; i++) {
      for (let j = 0; j < this.#grid[i].length; j++) {
        if (this.#grid[i][j] === piece)
          return FileRankFactory.getFileRank(i, j);
      }
    }
    return null;
  }

  findPinAndChecks(colour) {
    const pinnedPieces = [];
    let isKingChecked = false;
    const king = Board.filterColouredPieces(
      this.getPiecesByType(Piece.TYPE.KING),
      colour
    ).pop();
    const kingPosition = this.getPiecePosition(king);

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        //for each direction
        const position = {
          col: kingPosition.getCol() + i,
          row: kingPosition.getRow() + j,
        };
        let possiblyPinnedPiece = null;
        while (
          position.col < this.#col - 1 &&
          position.col >= 0 &&
          position.row < this.#row - 1 &&
          position.row >= 0
        ) {
          const piece = this.getPiece(
            FileRankFactory.getFileRank(position.col, position.row)
          );

          // this piece might be pinned
          if (piece && piece.getColour() === colour) {
            if (!possiblyPinnedPiece) {
              possiblyPinnedPiece = piece;
            } else {
              break;
            }
          } else if (piece && piece.getColour() !== colour) {
            const enemyPieceMoves = this.getValidMoves(piece);
            enemyPieceMoves.forEach((enemyPieceMove) => {
              const pieceAtEnemyMove = this.getPiece(
                FileRankFactory.getFileRank(
                  enemyPieceMove.col,
                  enemyPieceMove.row
                )
              );
              if (pieceAtEnemyMove && pieceAtEnemyMove === king) {
                isKingChecked = true;
              } else if (
                pieceAtEnemyMove &&
                pieceAtEnemyMove === possiblyPinnedPiece
              ) {
                pinnedPieces.push(possiblyPinnedPiece);
              }
            });
            break;
          }

          position.col += i;
          position.row += j;
        }
      }
    }

    const enemyKnights = Board.filterOutColouredPieces(
      this.getPiecesByType(Piece.TYPE.KNIGHT),
      colour
    );

    enemyKnights.find((enemyKnight) => {
      const enemyKnightMoves = this.getValidMoves(enemyKnight);
      const foundKing = enemyKnightMoves.find(
        (move) =>
          move.col === kingPosition.getCol() &&
          move.row === kingPosition.getRow()
      );

      if (foundKing) {
        isKingChecked = true;
      }
    });

    console.log("Pinned Pieces: ", pinnedPieces);
    console.log("King Checked: ", isKingChecked);
  }

  /**
   * Checks to see if this piece is under attacked by enemy pieces
   */

  isPieceUnderAttack(piece) {
    const pieceColor = piece.getColour();
    const enemyPieces = Board.filterOutColouredPieces(
      this.getAllPieces(),
      pieceColor
    );

    let found = false;
    enemyPieces.forEach((enemyPiece) => {
      const enemyAttackingPieces = this.getAttackingPieces(enemyPiece);
      const exists = enemyAttackingPieces.find((p) => p === piece);
      if (exists) found = true;
    });
    return found;
  }

  /**
   * Gets all of the enemy pieces that are under attack by this piece
   * @param {Piece} piece the piece that is attacking all enemy pieces
   * @returns the pieces being attacked by the piece passed in
   */
  getAttackingPieces(piece) {
    let pieces = [];
    let moves = piece.getAvailableMoves(this);

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];

      let pieceAtTheSpot = this.getPiece(
        FileRankFactory.getFileRank(move.col, move.row)
      );
      if (pieceAtTheSpot) pieces.push(pieceAtTheSpot);
    }

    return pieces;
  }

  /**
   * Finds and returns all of the pieces that DO NOT match the colour passed in
   * @param {*} pieces
   * @param {*} colour
   */
  static filterOutColouredPieces(pieces, colour) {
    return pieces.filter((piece) => piece.getColour() !== colour);
  }

  /**
   * Finds and returns all of the pieces that match the colour passed in
   * @param {*} pieces
   * @param {*} colour
   */
  static filterColouredPieces(pieces, colour) {
    return pieces.filter((piece) => piece.getColour() === colour);
  }

  getCommandHandler() {
    return this.#commandHandler;
  }

  getColumn() {
    return this.#col;
  }

  getRow() {
    return this.#row;
  }

  getMoveEventListener() {
    return this.#moveEventListener;
  }
}
