import { Game } from "../classes/Game.js";
import SearchEngine from "../classes/engine/SearchEngine.js";
import { Piece } from "../classes/pieces/Piece.js";
import VariantFactory from "../classes/variants/VariantFactory.js";

self.addEventListener("message", ({ data }) => {
  const { requestId, fen, variantName, depth } = data || {};

  try {
    if (!new Set(["classical", "two-queen"]).has(variantName)) {
      throw new Error("Bot search is unavailable for this variant.");
    }

    const game = new Game(VariantFactory.create(variantName), fen);
    game.addPlayer({ getColour: () => Piece.COLOUR.WHITE });
    game.addPlayer({ getColour: () => Piece.COLOUR.BLACK });

    const move = new SearchEngine({ depth }).findBestMove(game);
    self.postMessage({
      requestId,
      move: move
        ? {
            from: move.getFrom().getFileRank(),
            to: move.getTo().getFileRank(),
            promotionPieceType: move.getPromotionPieceType(),
          }
        : null,
    });
  } catch (error) {
    self.postMessage({
      requestId,
      error: error instanceof Error ? error.message : "Bot search failed.",
    });
  }
});
