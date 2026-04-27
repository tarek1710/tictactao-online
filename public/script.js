const socket = io();

let roomCode = "";
let mySymbol = "";
let myName = "";
let board = ["","","","","","","","",""];
let gameOver = false;

const boardElement = document.getElementById("board");

function drawBoard() {
  boardElement.innerHTML = "";

  board.forEach((cell, index) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.innerText = cell;

    div.addEventListener("click", () => {
      if (gameOver) return;

      socket.emit("makeMove", {
        roomCode,
        index,
        symbol: mySymbol
      });
    });

    boardElement.appendChild(div);
  });
}

drawBoard();

function createRoom() {
  myName = document.getElementById("playerName").value.trim();
  if (!myName) return alert("Enter your name");

  socket.emit("createRoom", myName);
}

function joinRoom() {
  myName = document.getElementById("playerName").value.trim();
  const code = document.getElementById("roomInput").value.trim();

  if (!myName) return alert("Enter your name");
  if (!code) return alert("Enter room code");

  socket.emit("joinRoom", { roomCode: code, name: myName });
}

function restartGame() {
  if (!gameOver) return;
  socket.emit("restartGame", roomCode);
}

socket.on("roomCreated", (data) => {
  roomCode = data.roomCode;
  mySymbol = data.symbol;

  document.getElementById("roomCode").innerText = "Room: " + roomCode;
  document.getElementById("status").innerText = "Waiting for another player...";
});

socket.on("roomJoined", (data) => {
  roomCode = data.roomCode;
  mySymbol = data.symbol;
});

socket.on("updateBoard", (data) => {
  board = data.board;
  gameOver = false;

  drawBoard();

  document.getElementById("status").innerText =
    data.currentTurn === mySymbol ? `${myName}'s Turn` : "Opponent's Turn";
});

socket.on("gameOver", (data) => {
  gameOver = true;
  document.getElementById("status").innerText = data.message;
});