/**
 * Pieces Affected
 * 
 * [
 *  {
 *    piece: Piece,
 *    affectType: ADD | REMOVE | MOVE | CAPTURE
 *    from: FileRank
 *    to: FileRank | null
 *    sideAffectOf: Piece | null // sideaffect is a dependent property meaning this piece's affect happened because of any other piece.
 *     
 *  }
 * 
 * ]
 */

export default class PieceAffect {
    static AFFECT_TYPES = {
        ADD: "ADD",
        REMOVE: "REMOVE",
        MOVE: "MOVE",
        CAPTURE: "CAPTURE"
    };

    #piece;
    #affectType;
    #from;
    #to;
    #sideAffectOf;

    constructor(piece, affectType, from, to, sideAffect) {
        this.#piece = piece;
        this.#affectType = affectType;
        this.#from = from;
        this.#to = to;
        this.#sideAffectOf = sideAffect;
    }

    getPiece() {
        return this.#piece;
    }

    getAffectType() {
        return this.#affectType;
    }

    getFrom() {
        return this.#from;
    }

    getTo() {
        return this.#to;
    }

    getSideAffectOf() {
        return this.#sideAffectOf;
    }
}