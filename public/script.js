const socket = io();

const board = document.getElementById("board");
const roomCodeText = document.getElementById("roomCode");
const statusText = document.getElementById("status");
const roomInput = document.getElementById("roomInput");

let roomCode = "";
let player = "";

for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  board.appendChild(cell);
}

function createRoom() {
  roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  roomCodeText.innerText = "Room Code: " + roomCode;
  statusText.innerText = "Room created. Waiting for player...";
}

function joinRoom() {
  const code = roomInput.value.trim();
  if (code === "") {
    alert("Enter room code");
    return;
  }
  roomCodeText.innerText = "Joined Room: " + code;
  statusText.innerText = "Joined room successfully";
}

function restartGame() {
  statusText.innerText = "Game restarted";
}