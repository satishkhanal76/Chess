import ClientGame from "./ClientGame.js";
import { Piece } from "./classes/pieces/Piece.js";
import SearchEngine from "./classes/engine/SearchEngine.js";

export default class LocalGame extends ClientGame {
    #botColour = null;
    #searchEngine = null;
    #botPending = false;

    constructor(variant) {
        super(variant);
    }

    startGame({ timeControl = "none", opponent = "human", playerColour = Piece.COLOUR.WHITE, botDepth = 2 } = {}) {
        this.#botColour = opponent === "bot"
            ? (playerColour === Piece.COLOUR.WHITE ? Piece.COLOUR.BLACK : Piece.COLOUR.WHITE)
            : null;
        this.#searchEngine = this.#botColour ? new SearchEngine({ depth: botDepth }) : null;
        if (this.#botColour) {
            this.getGameGUI().setCanOnlyColourMove(playerColour);
            this.getGame().moveEventListeners.addListener(() => this.#scheduleBotMove());
        }

        super.startGame({ timeControl });
        if (this.#botColour === this.getGame().getCurrentPlayer()?.getColour()) this.#scheduleBotMove();
    }

    #scheduleBotMove() {
        const game = this.getGame();
        if (
            !this.#searchEngine || this.#botPending || !this.getGameGUI().getIsGameStarted() ||
            game.isOver() || game.getCurrentPlayer()?.getColour() !== this.#botColour
        ) return;

        this.#botPending = true;
        this.getGameGUI().setStatus("The bot is thinking…");
        setTimeout(() => {
            try {
                const move = this.#searchEngine.findBestMove(game);
                if (move && !game.isOver()) game.movePiece(move);
            } finally {
                this.#botPending = false;
                if (!game.isOver()) this.getGameGUI().setStatus("Game in progress");
            }
        }, 80);
    }

}
