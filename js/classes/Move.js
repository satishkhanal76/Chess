export default class Move {
    #from;
    #to;
    
    #promotionPieceType;

    #by;

    constructor(from, to, { promotionPieceType } = {}) {
        this.#from = from;
        this.#to = to;

        this.#promotionPieceType = promotionPieceType;
    }


    getFrom() {
        return this.#from;
    }


    getTo() {
        return this.#to;
    }


    setPromotionPieceType(promotionPieceType) {
        this.#promotionPieceType = promotionPieceType;
    }

    getPromotionPieceType() {
        return this.#promotionPieceType;
    }
}