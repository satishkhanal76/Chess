import { Game } from "./classes/Game.js";
import ClassicalVariant from "./classes/variants/ClassicalVariant.js";
import TwoQueenVariant from "./classes/variants/TwoQueenVariant.js";

import { BoardGUI } from "./GUI/BoardGUI.js";

let GAME_VARIANT = "CLASSICAL";

let game = new Game();
const modal = document.getElementById("modal");
modal.style.display = "none";

let boardGUI = new BoardGUI(game, modal);

// document.addEventListener("dblclick", (eve) => {
//   if (GAME_VARIANT === "CLASSICAL") {
//     game = new Game(new TwoQueenVariant());
//     boardGUI.removeBoard();
//     boardGUI = new BoardGUI(game, modal);
//     GAME_VARIANT = "TWO_QUEEN";
//   } else if (GAME_VARIANT === "TWO_QUEEN") {
//     game = new Game(new ClassicalVariant());
//     boardGUI.removeBoard();
//     boardGUI = new BoardGUI(game, modal);
//     GAME_VARIANT = "CLASSICAL";
//   }
// });
