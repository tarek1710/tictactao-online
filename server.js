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

  for (let combo of wins) {
    const [a,b,c] = combo;
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
      players: [{ id: socket.id, symbol: "X" }],
      board: ["","","","","","","","",""],
      turn: "X",
      startingPlayer: "X"
    };

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, symbol: "X" });
  });

  socket.on("joinRoom", (roomCode) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("status", "Room not found");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("status", "Room full");
      return;
    }

    room.players.push({ id: socket.id, symbol: "O" });

    socket.join(roomCode);
    socket.emit("roomJoined", { roomCode, symbol: "O" });

    io.to(roomCode).emit("status", room.turn + "'s turn");
    io.to(roomCode).emit("updateBoard", room.board);
  });

  socket.on("makeMove", ({ roomCode, index, player }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.board[index] === "" && room.turn === player) {
      room.board[index] = player;

      const winner = checkWinner(room.board);

      if (winner) {
        io.to(roomCode).emit("updateBoard", room.board);
        io.to(roomCode).emit("status", winner + " wins!");
        return;
      }

      if (!room.board.includes("")) {
        io.to(roomCode).emit("updateBoard", room.board);
        io.to(roomCode).emit("status", "Draw!");
        return;
      }

      room.turn = player === "X" ? "O" : "X";

      io.to(roomCode).emit("updateBoard", room.board);
      io.to(roomCode).emit("status", room.turn + "'s turn");
    }
  });

  socket.on("restart", (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.startingPlayer = room.startingPlayer === "X" ? "O" : "X";
    room.turn = room.startingPlayer;
    room.board = ["","","","","","","","",""];

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", room.turn + "'s turn");
  });

});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});