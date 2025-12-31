import { Game } from "./classes/Game.js";
import ClassicalVariant from "./classes/variants/ClassicalVariant.js";
import TwoQueenVariant from "./classes/variants/TwoQueenVariant.js";
import LocalGame from "./LocalGame.js";
import OnlineGame from "./OnlineGame.js";

export default class Client{

    static GAME_TYPE = {
        LOCAL: "local",
        ONLINE: "online"
    }

    #gameType;
    #gameVariant;

    #clientGame;

    #socket;
    #roomId;

    constructor() {
        this.#gameType = Client.GAME_TYPE.LOCAL;
        this.#gameVariant = "classic";

    }

    setupGame() {
        switch(this.#gameType) {
            case Client.GAME_TYPE.LOCAL:
                this.#clientGame = new LocalGame(Client.getGameVariantObject(this.#gameVariant));
            break;
            case Client.GAME_TYPE.ONLINE:
                this.#clientGame = new OnlineGame(this.#socket, this.#roomId, Client.getGameVariantObject(this.#gameVariant));
            break;
            default:

            break;
        }
    }

    static getGameVariantObject(variant) {
        switch(variant) {
            case "two-queen":
                return new TwoQueenVariant();
                break;
            default:
                return new ClassicalVariant();
                break;
        }
    }

    setSocket(socket) {
        this.#socket = socket;
    }

    setRoomId(roomId) {
        this.#roomId = roomId;
    }

    setGameType(gameType) {
        this.#gameType = gameType;
    }

    setGameVariant(gameVariant) {
        this.#gameVariant = gameVariant;
        this.#clientGame.setupGame();
    }

    getGameVariant() {
        return this.#gameVariant;
    }

    startOnlineGame() {
        if(!(this.#clientGame instanceof OnlineGame)) throw new Error("Game type is not online!");
        this.#clientGame.startServerGame();
    }
}