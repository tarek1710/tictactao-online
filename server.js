const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create Room
  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substr(2, 5).toUpperCase();

    rooms[roomCode] = {
      players: [{ id: socket.id, symbol: "X" }],
      board: Array(9).fill(""),
      turn: "X"
    };

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, symbol: "X" });
  });

  // Join Room
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
    io.to(roomCode).emit("status", "Game started! X's turn");
  });

  // Make Move
  socket.on("makeMove", ({ roomCode, index, player }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.board[index] === "" && room.turn === player) {
      room.board[index] = player;
      room.turn = player === "X" ? "O" : "X";

      io.to(roomCode).emit("updateBoard", room.board);
      io.to(roomCode).emit("status", room.turn + "'s turn");
    }
  });

  // Restart Game
  socket.on("restart", (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.board = Array(9).fill("");
    room.turn = "X";

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", "Game restarted! X's turn");
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Render compatible port
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Server running on port " + PORT);
}); 