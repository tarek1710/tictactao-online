const socket = io();

let roomCode = "";
let player = "";
let board = ["", "", "", "", "", "", "", "", ""];

const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const roomCodeText = document.getElementById("roomCode");

socket.on("connect", () => {
  const savedRoom = localStorage.getItem("roomCode");
  const savedPlayer = localStorage.getItem("player");

  if (savedRoom && savedPlayer) {
    roomCode = savedRoom;
    player = savedPlayer;
    socket.emit("rejoinRoom", { roomCode, player });

    roomCodeText.innerText = "Room Code: " + roomCode;
    statusText.innerText = "Reconnected";
  }
});

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

  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("player", player);

  roomCodeText.innerText = "Room Code: " + roomCode;
  statusText.innerText = "Waiting for player...";
});

socket.on("roomJoined", (data) => {
  roomCode = data.roomCode;
  player = data.symbol;

  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("player", player);

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
        roomCode,
        index,
        player
      });
    }
  });
});

function restartGame() {
  socket.emit("restart", roomCode);
}