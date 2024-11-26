import { Game } from "./classes/Game.js";
import { Piece } from "./classes/pieces/Piece.js";
import { Player } from "./classes/players/Player.js";

import { BoardGUI } from "./GUI/BoardGUI.js";
import GameGUI from "./GUI/GameGUI.js";

const SERVER_URL = "http://localhost:3000";


let game = new Game();
const gameGUI = new GameGUI(game);

const modal = document.getElementById("modal");
modal.style.display = "none";


game.moveEventListeners.addListener((payload) => {
  console.log(payload)
})


// Handle the game type choosing
const topSection = document.getElementById("top-section");

const initializeLocalGame = () => {
  console.log('Starting a local game...');

  game.addPlayer(new Player(game.getBoard(), Piece.COLOUR.WHITE));
  game.addPlayer(new Player(game.getBoard(), Piece.COLOUR.BLACK));




  // Add logic to initialize a chess game between two players on the same device
}
initializeLocalGame();
const initializeOnlineGame = (socket) => {
  console.log('Starting an online game...');
  // Add logic to connect to an online server or peer-to-peer connection

  socket.emit("initializeGame", {})
}

// create option element for the game type
const createOption = (value, text) => {
  const option = document.createElement("option");
  option.innerText = text;
  option.setAttribute("value", value);

  return option;
}

//create the game type elements
const createGameTypeElements = (socket) => {
  const gameTypeLabel = document.createElement("label");
  gameTypeLabel.setAttribute("for", "game-type");
  gameTypeLabel.innerText = "Coose your game mode:";
  
  if(document.getElementById("game-type")) return;

  
  const selectElement = document.createElement("select");
  selectElement.setAttribute("id", "game-type");

  selectElement.addEventListener("change", (eve) => {
      const type = eve.target.value;
      
      if (type === 'local') {
        initializeLocalGame();
    } else if (type === 'online') {
        initializeOnlineGame(socket);
    }
  })

  selectElement.append(createOption("local", "Play in Person"));
  selectElement.append(createOption("online", "Play online"));


  topSection.append(gameTypeLabel);
  topSection.append(selectElement);

}


// Import or use Socket.IO from a CDN
const socket = io(SERVER_URL, {
  autoConnect: false, // Prevent automatic connection
  reconnection: true, // Allow reconnection attempts
  reconnectionAttempts: 5, // Limit number of reconnection attempts
  reconnectionDelay: 1000, // Delay between reconnections (in ms)
});

// Attempt to connect
// socket.connect();



socket.on('gameInitializationSuccess', (gameData) => {
  console.log(gameData);
  console.log("Game Started from the server!");

  // if(gameData == Piece.COLOUR.BLACK) {
  //   boardGUI.flipBoard();

  // }


  game.getBoard().getMoveEventListener().addListener((data) => {
    console.log(data);
  })
})


// Listen for connection success
socket.on("connect", () => {
  //add the option to play against someone online
  createGameTypeElements(socket);

  console.log("Connected to server:", socket.id);
});

// Handle connection error
socket.on("connect_error", (error) => {
  console.warn("Connection failed:", error.message);

  // Optionally stop reconnect attempts after a certain number of tries
  socket.io.opts.reconnection = false; // Disable further reconnections
});

// Handle disconnection
socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);
});

