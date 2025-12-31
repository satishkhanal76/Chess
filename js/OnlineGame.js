import Move from "./classes/Move.js";
import { Piece } from "./classes/pieces/Piece.js";
import Socket from "./classes/sockets/Socket.js";
import ClientGame from "./ClientGame.js";
import FileRankFactory from "./classes/FileRankFactory.js";

export default class OnlineGame  extends ClientGame{

    #socket;
    #playerColour;

    #roomId;


    constructor(socket, roomId, variant) {
        super(variant);

        this.#socket = socket;
        this.#roomId = roomId;

        this.addSocketEvents();
        this.addMoveListener();
    }


    addMoveListener() {
        this.getGame().moveEventListeners.addListener((event) => {
            //if it is not your move then don't broadcast it
            if(this.#playerColour !== event.player.getColour()) return;
            
            this.#socket.emit(Socket.EVENTS.MOVE_PIECE, {
                roomId: this.#roomId,
                from: event.requestedMove.getFrom(),
                to: event.requestedMove.getTo(),
                promotionPieceType: event.requestedMove.getPromotionPieceType()
            });
        })
    }


    addSocketEvents() {
        this.#socket.on(Socket.EVENTS.GAME_CREATED, (p) => this.onGameCreated(p));

        this.#socket.on(Socket.EVENTS.MOVE_PIECE, p => this.onMovePeace(p))
    }

    onMovePeace(payload) {
        const from = payload.from;
        const to = payload.to;
        const promotionPieceType = payload.promotionPieceType;
        const colour = payload.playerColour;

        if(colour === this.#playerColour) return; //this move was made by this player

        const fromFileRank = FileRankFactory.getFileRank(from.col, from.row);
        const toFileRank = FileRankFactory.getFileRank(to.col, to.row);

        this.getGame().movePiece(new Move(fromFileRank, toFileRank, { promotionPieceType }));

    }


    onGameCreated(payload) {
        this.#playerColour = payload.colour;

        if(!this.#playerColour) return;

        this.getGameGUI().setCanOnlyColourMove(this.#playerColour);

        this.flipBoardIfBlack();
        
    }


    flipBoardIfBlack() {
        if(this.#playerColour === Piece.COLOUR.BLACK) 
            this.getGameGUI().getBoardGUI().flipBoard();
    }

    startServerGame() {
        this.#socket.emit(Socket.EVENTS.CREATE_GAME, {
            roomId: this.#roomId,
            variant: this.getGameVariant().getVariantName()
        });
    }
}