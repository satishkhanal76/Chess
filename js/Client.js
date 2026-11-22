import VariantFactory from "./classes/variants/VariantFactory.js";
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
        this.#gameVariant = "classical";

    }

    setupGame(options = {}) {
        this.#clientGame?.dispose?.();
        if (typeof options === "string") this.#gameVariant = options;
        const { settings = {} } = typeof options === "object" ? options : {};
        switch(this.#gameType) {
            case Client.GAME_TYPE.LOCAL:
                this.#clientGame = new LocalGame(Client.getGameVariantObject(this.#gameVariant));
            break;
            case Client.GAME_TYPE.ONLINE:
                this.#clientGame = new OnlineGame(this.#socket, this.#roomId, Client.getGameVariantObject(this.#gameVariant), settings);
            break;
            default:

            break;
        }
    }

    static getGameVariantObject(variant) {
        return VariantFactory.create(variant);
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
    }

    getGameVariant() {
        return this.#gameVariant;
    }

    getClientGame() {
        return this.#clientGame;
    }

    startOnlineGame(settings) {
        if(!(this.#clientGame instanceof OnlineGame)) throw new Error("Game type is not online!");
        this.#clientGame.startServerGame(settings);
    }
}
