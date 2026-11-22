import ClientGame from "./ClientGame.js";
import { Piece } from "./classes/pieces/Piece.js";
import Move from "./classes/Move.js";
import FileRankFactory from "./classes/FileRankFactory.js";

export default class LocalGame extends ClientGame {
    #botColour = null;
    #botDepth = 2;
    #botPending = false;
    #disposed = false;
    #searchWorker = null;
    #pendingSearch = null;
    #searchRequestId = 0;

    constructor(variant) {
        super(variant);
    }

    startGame({ timeControl = "none", opponent = "human", playerColour = Piece.COLOUR.WHITE, botDepth = 2 } = {}) {
        this.#botColour = opponent === "bot"
            ? (playerColour === Piece.COLOUR.WHITE ? Piece.COLOUR.BLACK : Piece.COLOUR.WHITE)
            : null;
        this.#botDepth = botDepth;
        if (this.#botColour) {
            this.getGameGUI().setCanOnlyColourMove(playerColour);
            this.getGame().moveEventListeners.addListener(() => this.#scheduleBotMove());
        }

        super.startGame({ timeControl });
        if (this.#botColour === this.getGame().getCurrentPlayer()?.getColour()) this.#scheduleBotMove();
    }

    dispose() {
        this.#disposed = true;
        this.#searchRequestId += 1;
        this.#pendingSearch?.reject(new Error("This game has been replaced."));
        this.#pendingSearch = null;
        this.#searchWorker?.terminate();
        this.#searchWorker = null;
    }

    #scheduleBotMove() {
        const game = this.getGame();
        if (
            !this.#botColour || this.#disposed || this.#botPending || !this.getGameGUI().getIsGameStarted() ||
            game.isOver() || game.getCurrentPlayer()?.getColour() !== this.#botColour
        ) return;

        this.#botPending = true;
        const gameGUI = this.getGameGUI();
        const animationHandler = gameGUI.getAnimationHandler();
        if (animationHandler.getActiveAnimation()) gameGUI.setStatus("Your move is animating…");
        this.#playBotMoveAfterAnimation(game, gameGUI);
    }

    async #playBotMoveAfterAnimation(game, gameGUI) {
        let searchFailed = false;
        try {
            await gameGUI.getAnimationHandler().waitForIdle();
            if (this.#disposed || game.isOver() || game.getCurrentPlayer()?.getColour() !== this.#botColour) return;

            gameGUI.setStatus("The bot is thinking…");
            const moveData = await this.#findBestMove(game);
            if (
                !this.#disposed && moveData && !game.isOver() &&
                game.getCurrentPlayer()?.getColour() === this.#botColour
            ) {
                const move = new Move(
                    FileRankFactory.getFileRank(moveData.from),
                    FileRankFactory.getFileRank(moveData.to),
                    { promotionPieceType: moveData.promotionPieceType }
                );
                game.movePiece(move);
            }
        } catch {
            if (!this.#disposed) {
                searchFailed = true;
                gameGUI.setStatus("The bot couldn't complete its search. Start a new game to try again.");
            }
        } finally {
            this.#botPending = false;
            if (!this.#disposed && !searchFailed && !game.isOver()) gameGUI.setStatus("Game in progress");
        }
    }

    #findBestMove(game) {
        const worker = this.#getSearchWorker();
        const requestId = ++this.#searchRequestId;

        return new Promise((resolve, reject) => {
            this.#pendingSearch = { requestId, resolve, reject };
            try {
                worker.postMessage({
                    requestId,
                    fen: game.getFen(),
                    variantName: game.getVariant().getVariantName(),
                    depth: this.#botDepth,
                });
            } catch (error) {
                this.#pendingSearch = null;
                reject(error);
            }
        });
    }

    #getSearchWorker() {
        if (this.#searchWorker) return this.#searchWorker;

        const worker = new Worker(new URL("./workers/BotSearchWorker.js", import.meta.url), { type: "module" });
        worker.addEventListener("message", ({ data }) => {
            const pending = this.#pendingSearch;
            if (!pending || data?.requestId !== pending.requestId) return;

            this.#pendingSearch = null;
            if (data.error) pending.reject(new Error(data.error));
            else pending.resolve(data.move || null);
        });
        worker.addEventListener("error", (event) => {
            event.preventDefault();
            const pending = this.#pendingSearch;
            this.#pendingSearch = null;
            worker.terminate();
            if (this.#searchWorker === worker) this.#searchWorker = null;
            pending?.reject(new Error(event.message || "Bot search worker failed."));
        });
        this.#searchWorker = worker;
        return worker;
    }

}
