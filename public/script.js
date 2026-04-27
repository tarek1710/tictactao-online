const socket = io();

let roomCode = "";
let mySymbol = "";
let currentTurn = "X";
let board = ["", "", "", "", "", "", "", "", ""];

// Board create
const boardElement = document.getElementById("board");
for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;

  cell.addEventListener("click", () => {
    if (board[i] === "" && mySymbol === currentTurn) {
      socket.emit("makeMove", { roomCode, index: i, symbol: mySymbol });
    }
  });

  boardElement.appendChild(cell);
}

// Create room
function createRoom() {
  socket.emit("createRoom");
}

// Join room
function joinRoom() {
  const input = document.getElementById("roomInput").value.trim();
  if (input !== "") {
    socket.emit("joinRoom", input);
  }
}

// Restart game
function restartGame() {
  socket.emit("restartGame", roomCode);
}

// Room created
socket.on("roomCreated", (data) => {
  roomCode = data.roomCode;
  mySymbol = data.symbol;

  document.getElementById("roomCode").innerText = "Room Code: " + roomCode;
  document.getElementById("status").innerText = "Waiting for player...";
});

// Joined room
socket.on("roomJoined", (data) => {
  roomCode = data.roomCode;
  mySymbol = data.symbol;

  document.getElementById("roomCode").innerText = "Room Code: " + roomCode;
  document.getElementById("status").innerText = "Game Started! Turn: X";
});

// Update board
socket.on("updateBoard", (data) => {
  board = data.board;
  currentTurn = data.currentTurn;

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    cell.innerText = board[index];
  });

  document.getElementById("status").innerText = "Turn: " + currentTurn;
});

// Winner
socket.on("gameOver", (data) => {
  document.getElementById("status").innerText = data.message;
});

// Restart board
socket.on("restartBoard", () => {
  board = ["", "", "", "", "", "", "", "", ""];
  currentTurn = "X";

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.innerText = "";
  });

  document.getElementById("status").innerText = "Turn: X";
});