
import Socket from "./classes/sockets/Socket.js";
import Client from "./Client.js";

const SERVER_URL = window.location.origin;

const client = new Client();


const modal = document.getElementById("modal");
// modal.style.display = "none";




const initializeLocalGame = () => {
  console.log('Starting a local game...');

  
  client.setGameType(Client.GAME_TYPE.LOCAL);
  client.setupGame("404-variant");
  
}
initializeLocalGame();
