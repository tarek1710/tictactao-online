const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    rooms[roomCode] = {
      board: ["","","","","","","","",""],
      turn: "X",
      starter: "X",
      players: {},
      gameOver: false,
      restartUsed: false
    };

    rooms[roomCode].players[socket.id] = "X";

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, symbol: "X" });
  });

  socket.on("joinRoom", (roomCode) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("status", "Room not found");
      return;
    }

    if (Object.keys(room.players).length >= 2) {
      socket.emit("status", "Room full");
      return;
    }

    room.players[socket.id] = "O";

    socket.join(roomCode);
    socket.emit("roomJoined", { roomCode, symbol: "O" });

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", room.turn + "'s turn");
  });

  socket.on("rejoinRoom", ({ roomCode, player }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.players[socket.id] = player;
    socket.join(roomCode);

    socket.emit("updateBoard", room.board);
    socket.emit("status", room.turn + "'s turn");
  });

  socket.on("makeMove", ({ roomCode, index, player }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (Object.keys(room.players).length < 2) return;
    if (room.gameOver) return;
    if (room.board[index] !== "") return;
    if (room.turn !== player) return;

    room.board[index] = player;

    const winner = checkWinner(room.board);

    if (winner) {
      room.gameOver = true;
      room.restartUsed = false;

      io.to(roomCode).emit("updateBoard", room.board);
      io.to(roomCode).emit("status", winner + " wins!");
      return;
    }

    if (!room.board.includes("")) {
      room.gameOver = true;
      room.restartUsed = false;

      io.to(roomCode).emit("updateBoard", room.board);
      io.to(roomCode).emit("status", "Draw!");
      return;
    }

    room.turn = player === "X" ? "O" : "X";

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", room.turn + "'s turn");
  });

  socket.on("restart", (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (!room.gameOver) {
      socket.emit("status", "Game is still running!");
      return;
    }

    if (room.restartUsed) {
      socket.emit("status", "Restart already used!");
      return;
    }

    room.restartUsed = true;
    room.gameOver = false;

    room.starter = room.starter === "X" ? "O" : "X";
    room.turn = room.starter;
    room.board = ["","","","","","","","",""];

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", room.turn + "'s turn");
  });

});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});