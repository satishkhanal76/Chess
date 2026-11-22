import Move from "./classes/Move.js";
import { Piece } from "./classes/pieces/Piece.js";
import Socket from "./classes/sockets/Socket.js";
import ClientGame from "./ClientGame.js";
import FileRankFactory from "./classes/FileRankFactory.js";

export default class OnlineGame  extends ClientGame{

    #socket;
    #playerColour;

    #roomId;
    #settings;


    constructor(socket, roomId, variant, settings = {}) {
        super(variant);

        this.getGameGUI().setOnlineMode(true);

        this.#socket = socket;
        this.#roomId = roomId;
        this.#settings = settings;

        this.addSocketEvents();
        this.addMoveListener();
        if (settings.colour) this.onGameCreated(settings);
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
        this.#socket.on(Socket.EVENTS.GAME_STARTED, (p) => this.onGameStarted(p));
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
        this.getGameGUI().setStatus("Waiting for your opponent to join…");

        if (payload.variant && payload.variant !== this.#settings.variant) {
            this.getGameGUI().setStatus("Room settings did not match. Please rejoin this room.");
        }

        if (payload.variant && this.#roomId) {
            window.dispatchEvent(new CustomEvent("chess:room-ready", {
                detail: { roomId: this.#roomId },
            }));
        }
        
    }


    flipBoardIfBlack() {
        if(this.#playerColour === Piece.COLOUR.BLACK) 
            this.getGameGUI().setBoardOrientation(Piece.COLOUR.BLACK);
    }

    startServerGame() {
        this.#socket.emit(Socket.EVENTS.CREATE_GAME, {
            roomId: this.#roomId,
            variant: this.getVariant().getVariantName(),
            timeControl: this.#settings.timeControl || "none",
        });
    }

    onGameStarted(payload) {
        const timeControl = payload.timeControl || this.#settings.timeControl || "none";
        super.startGame({ timeControl });
        this.getGameGUI().setStatus("Online game in progress");
    }
}
