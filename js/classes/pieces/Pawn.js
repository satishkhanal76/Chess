import { Movement } from "../Movement.js";
import { Piece } from "./Piece.js";

export class Pawn extends Piece {
    constructor(character, colour) {
        super(Piece.TYPE.PAWN, character, colour);
        this.configureMoves();
    }

    configureMoves() {
        if(this.getColour() === Piece.COLOUR.WHITE) {
            this.addMoves(Movement.getForwardToTop);
        }else {
            this.addMoves(Movement.getForwardToBottom);
        }
    }

    getAvailableMoves(board) {
        let availableMoves = super.getAvailableMoves(board);

        //if there is an opponent's piece at front then it's an invalid position
        availableMoves = this.validateTheMove(board, availableMoves);

        //if there is an opponent's piece on the diagonal then its a valid move
        let piecePosition = board.getPiecePosition(this);
        let moves = [];

        if(this.getColour() === Piece.COLOUR.WHITE) {
            moves = moves.concat(Movement.getOneDiagnolToTopLeft(board, piecePosition.col, piecePosition.row));
            moves = moves.concat(Movement.getOneDiagnolToTopRight(board, piecePosition.col, piecePosition.row));
        }else {
            moves = moves.concat(Movement.getOneDiagnolToBottomLeft(board, piecePosition.col, piecePosition.row));
            moves = moves.concat(Movement.getOneDiagnolToBottomRight(board, piecePosition.col, piecePosition.row));
        }
        
        moves.forEach(move => {
            let piece = board.getPiece(move.col, move.row);
            if(piece && (piece.getColour() != this.getColour())) {
                availableMoves.push(move);
            }
        })

        return availableMoves;

    }


    validateTheMove(board, availableMoves) {
        for (let i = 0; i < availableMoves.length; i++) {
            let move = availableMoves[i];
            let piece = board.getPiece(move.col, move.row);
            if(piece && (piece.getColour() != this.getColour())) {
                availableMoves.splice(i, 1);
            }
        }
        return availableMoves;
    }
}