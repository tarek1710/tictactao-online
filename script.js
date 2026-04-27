console.log("script loaded");

const socket = io();

socket.on("connect", () => {
    console.log("socket connected");
});
let roomCode = "";
let player = "";
let playerName = "";

const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const roomCodeText = document.getElementById("roomCode");

socket.on("connect", () => {
  const savedRoom = localStorage.getItem("roomCode");
  const savedPlayer = localStorage.getItem("player");
  const savedName = localStorage.getItem("playerName");

  if (savedRoom && savedPlayer && savedName) {
    roomCode = savedRoom;
    player = savedPlayer;
    playerName = savedName;

    socket.emit("rejoinRoom", { roomCode, player, playerName });
    roomCodeText.innerText = "Room: " + roomCode;
  }
});

function createRoom() {
  playerName = document.getElementById("playerName").value;
  socket.emit("createRoom", playerName);
}

function joinRoom() {
  playerName = document.getElementById("playerName").value;
  const roomInput = document.getElementById("roomInput").value.toUpperCase();

  socket.emit("joinRoom", { roomCode: roomInput, playerName });
}

socket.on("roomCreated", data => {
  roomCode = data.roomCode;
  player = data.symbol;

  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("player", player);
  localStorage.setItem("playerName", playerName);

  roomCodeText.innerText = "Room: " + roomCode;
});

socket.on("roomJoined", data => {
  roomCode = data.roomCode;
  player = data.symbol;

  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("player", player);
  localStorage.setItem("playerName", playerName);

  roomCodeText.innerText = "Room: " + roomCode;
});

socket.on("updateBoard", data => {
  const board = data.board || data;
  const winCombo = data.winCombo || [];

  cells.forEach((cell, i) => {
    cell.innerText = board[i];

    cell.classList.remove("filled");
    cell.classList.remove("win");

    if (board[i] !== "") cell.classList.add("filled");
    if (winCombo.includes(i)) cell.classList.add("win");
  });
});

socket.on("status", msg => {
  statusText.innerText = msg;
});

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    socket.emit("makeMove", { roomCode, index: i, player });
  });
});

function restartGame() {
  socket.emit("restart", roomCode);
}