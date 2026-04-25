const socket = io();

let roomCode = "";
let player = "";
let board = ["", "", "", "", "", "", "", "", ""];

const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const roomCodeText = document.getElementById("roomCode");

function createRoom() {
  socket.emit("createRoom");
}

function joinRoom() {
  const code = document.getElementById("roomInput").value.toUpperCase();
  socket.emit("joinRoom", code);
}

socket.on("roomCreated", (data) => {
  roomCode = data.roomCode;
  player = data.symbol;
  roomCodeText.innerText = "Room Code: " + roomCode;
  statusText.innerText = "Waiting for player...";
});

socket.on("roomJoined", (data) => {
  roomCode = data.roomCode;
  player = data.symbol;
  roomCodeText.innerText = "Joined Room: " + roomCode;
});

socket.on("status", (msg) => {
  statusText.innerText = msg;
});

socket.on("updateBoard", (newBoard) => {
  board = newBoard;
  updateBoard();
});

function updateBoard() {
  cells.forEach((cell, index) => {
    cell.innerText = board[index];
  });
}

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (board[index] === "") {
      socket.emit("makeMove", {
        roomCode: roomCode,
        index: index,
        player: player
      });
    }
  });
});

function restartGame() {
  socket.emit("restart", roomCode);
}