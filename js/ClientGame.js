import ClassicalVariant from "./classes/variants/ClassicalVariant.js";
import GameGUI from "./GUI/GameGUI.js";
import {Game} from "./classes/Game.js";
import { Player } from "./classes/players/Player.js";
import { Piece } from "./classes/pieces/Piece.js";

export default class ClientGame {

    #variant;

    #game;
    #gameGUI;

    constructor(variant) {
        this.#variant = variant || new ClassicalVariant();

        this.setupGame();
    }


    setupGame() {
        this.#game = new Game(this.#variant);
        this.#gameGUI = new GameGUI(this.#game);

        this.addPlayers();
    }

    addPlayers() {
        this.#game.addPlayer(new Player(Piece.COLOUR.WHITE));
        this.#game.addPlayer(new Player(Piece.COLOUR.BLACK));
    }


    getVariant() {
        return this.#variant;
    }

    changeVariant(variant) {
        if(this.#game.getIsInProgress()) throw new Error("A game already in progress.");
        this.#variant = variant;
        this.setupGame();
    }

    getGame() {
        return this.#game;
    }

    getGameGUI() {
        return this.#gameGUI;
    }
}