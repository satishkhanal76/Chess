import { Game } from "./classes/Game.js";
import LocalGame from "./LocalGame.js";
import OnlineGame from "./OnlineGame.js";

export default class Client{

    static GAME_TYPE = {
        LOCAL: "local",
        ONLINE: "online"
    }

    #gameType;

    #clientGame;

    #socket;
    #roomId;

    constructor() {
        this.#gameType = Client.GAME_TYPE.LOCAL;

    }

    setupGame() {
        switch(this.#gameType) {
            case Client.GAME_TYPE.LOCAL:
                this.#clientGame = new LocalGame();
            break;
            case Client.GAME_TYPE.ONLINE:
                this.#clientGame = new OnlineGame(this.#socket, this.#roomId);
            break;
            default:

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

    startOnlineGame() {
        if(!(this.#clientGame instanceof OnlineGame)) throw new Error("Game type is not online!");
        this.#clientGame.startServerGame();
    }
}