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
    #clockOffsetMs = 0;
    #hasClockOffset = false;
    #bestClockPingRtt = Infinity;
    #lastClockSequence = 0;


    constructor(socket, roomId, variant, settings = {}) {
        super(variant);

        this.getGameGUI().setOnlineMode(true);

        this.#socket = socket;
        this.#roomId = roomId;
        this.#settings = settings;
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible" && !this.getGame().isOver()) this.#sendClockPing();
        });

        this.getGameGUI().setOnlineActionHandlers({
            offerDraw: () => this.#emitGameAction(Socket.EVENTS.OFFER_DRAW),
            acceptDraw: () => this.#emitGameAction(Socket.EVENTS.ACCEPT_DRAW),
            declineDraw: () => this.#emitGameAction(Socket.EVENTS.DECLINE_DRAW),
            claimDraw: () => this.#emitGameAction(Socket.EVENTS.CLAIM_DRAW),
            resign: () => this.#emitGameAction(Socket.EVENTS.RESIGN),
        });

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
        this.#socket.on(Socket.EVENTS.MOVE_PIECE, p => this.onMovePeace(p));
        this.#socket.on(Socket.EVENTS.CLOCK_SYNC, (p) => this.#applyClockSnapshot(p));
        this.#socket.on(Socket.EVENTS.CLOCK_PONG, (p) => this.#updateClockOffset(p));
        this.#socket.on(Socket.EVENTS.DRAW_OFFERED, (p) => this.getGameGUI().setOnlineDrawOffer(p.colour));
        this.#socket.on(Socket.EVENTS.DRAW_OFFER_CLEARED, () => this.getGameGUI().setOnlineDrawOffer(null));
        this.#socket.on(Socket.EVENTS.GAME_RESULT, (result) => {
            this.getGame().applyRemoteResult(result);
        });
        this.#socket.on(Socket.EVENTS.GAME_ACTION_REJECTED, (p) => this.getGameGUI().setStatus(p.message || "That game action was not accepted."));
    }

    #emitGameAction(eventName) {
        this.#socket.emit(eventName, { roomId: this.#roomId });
    }

    onMovePeace(payload) {
        const from = payload.from;
        const to = payload.to;
        const promotionPieceType = payload.promotionPieceType;
        const colour = payload.playerColour;

        if(colour === this.#playerColour) {
            this.#applyClockSnapshot(payload.clock);
            return;
        }

        const fromFileRank = FileRankFactory.getFileRank(from.col, from.row);
        const toFileRank = FileRankFactory.getFileRank(to.col, to.row);

        this.getGame().movePiece(new Move(fromFileRank, toFileRank, { promotionPieceType }));
        this.#applyClockSnapshot(payload.clock);

    }


    onGameCreated(payload) {
        this.#playerColour = payload.colour;

        if(!this.#playerColour) return;

        this.getGameGUI().setCanOnlyColourMove(this.#playerColour);
        this.getGameGUI().setOnlinePlayerColour(this.#playerColour);
        this.#lastClockSequence = 0;
        this.#startClockPings();

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
        super.startGame({ timeControl, onClockFlag: () => {} });
        this.#sendClockPing();
        this.getGameGUI().setStatus("Online game in progress");
    }

    #startClockPings() {
        this.#sendClockPing();
    }

    #sendClockPing() {
        if (!this.#playerColour || !this.#roomId) return;
        this.#socket.emit(Socket.EVENTS.CLOCK_PING, {
            roomId: this.#roomId,
            clientSentAt: Date.now(),
        });
    }

    #updateClockOffset(payload) {
        if (!Number.isFinite(payload?.clientSentAt) || !Number.isFinite(payload?.serverTimestamp)) return;
        const receivedAt = Date.now();
        const roundTripMs = Math.max(0, receivedAt - payload.clientSentAt);
        const measuredOffset = payload.serverTimestamp - (payload.clientSentAt + receivedAt) / 2;

        if (!this.#hasClockOffset || roundTripMs <= this.#bestClockPingRtt) {
            this.#clockOffsetMs = measuredOffset;
            this.#bestClockPingRtt = roundTripMs;
            this.#hasClockOffset = true;
        } else {
            this.#clockOffsetMs = this.#clockOffsetMs * 0.8 + measuredOffset * 0.2;
        }
    }

    #applyClockSnapshot(snapshot) {
        if (!snapshot || !Number.isFinite(snapshot.sequence) || !Number.isFinite(snapshot.serverTimestamp)) return;
        if (snapshot.sequence <= this.#lastClockSequence) return;
        this.#lastClockSequence = snapshot.sequence;

        const localNow = Date.now();
        const estimatedServerNow = localNow + (this.#hasClockOffset ? this.#clockOffsetMs : 0);
        const elapsedMs = Math.max(0, estimatedServerNow - snapshot.serverTimestamp);
        this.getGame().getClock()?.applyServerSnapshot(snapshot, elapsedMs);
    }
}
