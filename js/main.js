import Socket from "./classes/sockets/Socket.js";
import Client from "./Client.js";

const SERVER_URL = window.location.origin;
const gameType = document.getElementById("game-type");
const gameMode = document.getElementById("game-mode");
const timeControl = document.getElementById("time-control");
const opponentType = document.getElementById("opponent-type");
const setupPanel = document.getElementById("setup-panel");
const localActions = document.getElementById("local-actions");
const onlineActions = document.getElementById("online-actions");
const opponentField = document.getElementById("opponent-field");
const playerColourField = document.getElementById("player-colour-field");
const botDifficultyField = document.getElementById("bot-difficulty-field");
const setupFeedback = document.getElementById("setup-feedback");
const roomBanner = document.getElementById("game-room-id");
const roomIdElement = document.getElementById("room-id");
const gameStatus = document.getElementById("game-status");

const client = new Client();
client.setGameType(Client.GAME_TYPE.LOCAL);
client.setGameVariant(gameMode.value);
client.setupGame();

const isDev = window.location.hostname === "localhost";
const socket = io(SERVER_URL, {
  path: isDev ? "/socket.io" : "/chess/socket.io",
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const showFeedback = (message, isError = false) => {
  setupFeedback.textContent = message;
  setupFeedback.classList.toggle("is-error", isError);
};

const refreshSetup = () => {
  const isOnline = gameType.value === "online";
  const isBot = !isOnline && opponentType.value === "bot";
  localActions.hidden = isOnline;
  onlineActions.hidden = !isOnline;
  opponentField.hidden = isOnline;
  playerColourField.hidden = !isBot;
  botDifficultyField.hidden = !isBot;
  showFeedback(isOnline ? "Choose a variant and time control for your room." : "Choose your settings, then start when you’re ready.");
  if (isOnline && !socket.connected) socket.connect();
};

const sendWhenConnected = (eventName, payload) => {
  if (socket.connected) socket.emit(eventName, payload);
  else {
    socket.connect();
    socket.once(Socket.EVENTS.CONNECTION_SUCCESS, () => socket.emit(eventName, payload));
  }
};

document.getElementById("start-local-button").addEventListener("click", () => {
  client.setGameType(Client.GAME_TYPE.LOCAL);
  client.setGameVariant(gameMode.value);
  client.setupGame();
  client.getClientGame().startGame({
    timeControl: timeControl.value,
    opponent: opponentType.value,
    playerColour: document.getElementById("player-colour").value,
    botDepth: Number(document.getElementById("bot-difficulty").value),
  });
  setupPanel.hidden = true;
  document.getElementById("new-game-button").hidden = false;
});

document.getElementById("new-game-button").addEventListener("click", () => {
  client.setGameType(Client.GAME_TYPE.LOCAL);
  client.setGameVariant(gameMode.value);
  client.setupGame();
  roomBanner.hidden = true;
  setupPanel.hidden = false;
  document.getElementById("new-game-button").hidden = true;
});

gameType.addEventListener("change", refreshSetup);
opponentType.addEventListener("change", refreshSetup);

document.getElementById("create-room-button").addEventListener("click", () => {
  showFeedback("Connecting to the game server…");
  sendWhenConnected(Socket.EVENTS.CREATE_ROOM);
});

document.getElementById("game-room-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const roomCode = document.getElementById("room-code").value.trim();
  if (!roomCode) {
    showFeedback("Enter a room code to join.", true);
    return;
  }
  showFeedback("Joining room…");
  sendWhenConnected(Socket.EVENTS.JOIN_ROOM, roomCode);
});

socket.on(Socket.EVENTS.CONNECTION_SUCCESS, () => client.setSocket(socket));
socket.on(Socket.EVENTS.CONNECTION_ERROR, () => showFeedback("Could not connect to the game server. Try again.", true));
socket.on(Socket.EVENTS.USER_DISCONNECT, () => {
  if (gameType.value === "online") gameStatus.textContent = "Disconnected from the game server";
});

socket.on(Socket.EVENTS.ROOM_JOIN_SUCCESS, (payload) => {
  const isCreator = Boolean(payload.isCreator);
  const settings = {
    variant: isCreator ? gameMode.value : payload.variant,
    timeControl: isCreator ? timeControl.value : payload.timeControl,
    colour: payload.colour,
  };
  if (!settings.variant || !settings.timeControl) {
    showFeedback("The room did not provide valid game settings. Ask the host to recreate it.", true);
    return;
  }

  gameMode.value = settings.variant;
  timeControl.value = settings.timeControl;
  client.setSocket(socket);
  client.setRoomId(payload.roomId);
  client.setGameType(Client.GAME_TYPE.ONLINE);
  client.setGameVariant(settings.variant);
  client.setupGame({ settings });
  roomIdElement.textContent = payload.roomId;
  roomBanner.hidden = isCreator;
  setupPanel.hidden = true;
  gameStatus.textContent = isCreator ? "Preparing your room…" : "Waiting for the host to start…";
  if (isCreator) client.startOnlineGame(settings);
});

window.addEventListener("chess:room-ready", (event) => {
  roomIdElement.textContent = event.detail.roomId;
  roomBanner.hidden = false;
  gameStatus.textContent = "Room created. Waiting for your opponent…";
});

socket.on(Socket.EVENTS.ROOM_NOT_FOUND, (payload) => {
  setupPanel.hidden = false;
  showFeedback(payload.message || "Could not join that room.", true);
});

socket.on(Socket.EVENTS.ROOM_DESTROYED, (payload) => {
  roomBanner.hidden = true;
  setupPanel.hidden = false;
  gameStatus.textContent = payload.message || "The room was closed.";
});

socket.on(Socket.EVENTS.ROOM_PLAYER_LEFT, (payload) => {
  gameStatus.textContent = payload.message || "Your opponent left the room.";
});

socket.on(Socket.EVENTS.MOVE_INVALID, (payload) => {
  showFeedback(payload.message || "That move was not accepted by the server.", true);
});

document.getElementById("copy-room-button").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(roomIdElement.textContent);
    gameStatus.textContent = "Room code copied. Waiting for your opponent…";
  } catch {
    gameStatus.textContent = `Share room code: ${roomIdElement.textContent}`;
  }
});

refreshSetup();
