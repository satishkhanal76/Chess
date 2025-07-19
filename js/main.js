import FileRankFactory from "./classes/FileRankFactory.js";
import { Game } from "./classes/Game.js";
import Move from "./classes/Move.js";
import { Piece } from "./classes/pieces/Piece.js";
import { Player } from "./classes/players/Player.js";
import Socket from "./classes/sockets/Socket.js";
import Client from "./Client.js";

import GameGUI from "./GUI/GameGUI.js";

const SERVER_URL = window.location.origin;


// Target Elements
const gameTypeElement = document.getElementById("game-type");
const gameRoomForm = document.getElementById("game-room-form");
const joinRoomButton = document.getElementById("join-room-button");
const createRoomButton = document.getElementById("create-room-button");
const gameRoomID = document.getElementById("game-room-id");
const roomIdElement = document.getElementById("room-id");


//hide Game Room Form until it is a online Option
gameRoomID.style.display = "none";
gameRoomForm.style.display = "none";
gameRoomForm.addEventListener("submit", (event) => {
  event.preventDefault();
});


const client = new Client();


const modal = document.getElementById("modal");
modal.style.display = "none";




const initializeLocalGame = () => {
  console.log('Starting a local game...');

  
  client.setGameType(Client.GAME_TYPE.LOCAL);
  client.setupGame();
}
initializeLocalGame();

const isDev = window.location.hostname === "localhost";


// Import or use Socket.IO from a CDN
const socket = io(SERVER_URL, {
  path: isDev ? "/socket.io" : "/chess/socket.io",
  autoConnect: false, // Prevent automatic connection
  reconnection: true, // Allow reconnection attempts
  reconnectionAttempts: 5, // Limit number of reconnection attempts
  reconnectionDelay: 1000, // Delay between reconnections (in ms)
});


// Connected to Server
socket.on(Socket.EVENTS.CONNECTION_SUCCESS, () => {
  client.setSocket(socket);
  console.log("Connected to server:", socket.id);
});

// Handle connection error
socket.on(Socket.EVENTS.CONNECTION_ERROR, (error) => {
  console.warn("Connection failed:", error.message);

  // Optionally stop reconnect attempts after a certain number of tries
  socket.io.opts.reconnection = false; // Disable further reconnections
});

// Disconnected from server
socket.on(Socket.EVENTS.USER_DISCONNECT, (reason) => {
  console.log("Disconnected from server:", reason);
});


socket.on(Socket.EVENTS.ROOM_JOIN_SUCCESS, (payload) => {
  // start server game when room join success
  client.setSocket(socket);
  client.setRoomId(payload.roomId);
  client.setGameType(Client.GAME_TYPE.ONLINE);
  client.setupGame();
  client.startOnlineGame();


  gameRoomForm.style.display = "none";

  roomIdElement.innerText = payload.roomId;
  gameRoomID.style.display = "block";
});



socket.on(Socket.EVENTS.MOVE_INVALID, (payload) => {
  console.error(payload);
})


socket.on(Socket.EVENTS.ROOM_NOT_FOUND, (payload) => {
  alert(payload.message);
});

socket.on(Socket.EVENTS.ROOM_DESTROYED, (payload) => {
  alert(payload.message);
  gameRoomID.style.display = "none";
  gameRoomForm.style.display = "block";
}
);

socket.on(Socket.EVENTS.ROOM_PLAYER_LEFT, (payload) => {
  alert(payload.message);
})


gameTypeElement.addEventListener("change", (event) => {
  const gameType = event.target.value;

  switch(gameType) {
    case "online":
      // Attempt to connect
      socket.connect();
      gameRoomForm.style.display = "block";

      break;
    case "local":
      initializeLocalGame();
      gameRoomForm.style.display = "none";
      break;
  }
});

// Join Room Button Handler
joinRoomButton.addEventListener("click", () => {
  const roomCode = document.getElementById("room-code").value;

  socket.emit(Socket.EVENTS.JOIN_ROOM, roomCode);
});

createRoomButton.addEventListener("click", () => {
  socket.emit(Socket.EVENTS.CREATE_ROOM);
}); 