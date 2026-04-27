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
      return { winner: board[a], combo };
    }
  }

  return null;
}

io.on("connection", (socket) => {

  socket.on("createRoom", (playerName) => {
    const roomCode = Math.random().toString(36).substring(2,7).toUpperCase();

    rooms[roomCode] = {
      board: ["","","","","","","","",""],
      turn: "X",
      starter: "X",
      players: {},
      names: {},
      gameOver: false
    };

    rooms[roomCode].players[socket.id] = "X";
    rooms[roomCode].names["X"] = playerName;

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, symbol: "X" });
  });

  socket.on("joinRoom", ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit("status", "Room not found");

    if (Object.keys(room.players).length >= 2) {
      return socket.emit("status", "Room full");
    }

    room.players[socket.id] = "O";
    room.names["O"] = playerName;

    socket.join(roomCode);
    socket.emit("roomJoined", { roomCode, symbol: "O" });

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", room.names[room.turn] + "'s turn");
  });

  socket.on("rejoinRoom", ({ roomCode, player, playerName }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.players[socket.id] = player;
    room.names[player] = playerName;

    socket.join(roomCode);
    socket.emit("updateBoard", room.board);
    socket.emit("status", room.names[room.turn] + "'s turn");
  });

  socket.on("makeMove", ({ roomCode, index, player }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (Object.keys(room.players).length < 2) return;
    if (room.gameOver) return;
    if (room.turn !== player) return;
    if (room.board[index] !== "") return;

    room.board[index] = player;

    const result = checkWinner(room.board);

    if (result) {
      room.gameOver = true;

      io.to(roomCode).emit("updateBoard", {
        board: room.board,
        winCombo: result.combo
      });

      io.to(roomCode).emit("status", room.names[result.winner] + " wins!");
      return;
    }

    if (!room.board.includes("")) {
      room.gameOver = true;
      io.to(roomCode).emit("updateBoard", room.board);
      io.to(roomCode).emit("status", "Draw!");
      return;
    }

    room.turn = player === "X" ? "O" : "X";

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", room.names[room.turn] + "'s turn");
  });

  socket.on("restart", (roomCode) => {
    const room = rooms[roomCode];
    if (!room || !room.gameOver) return;

    room.board = ["","","","","","","","",""];
    room.gameOver = false;
    room.starter = room.starter === "X" ? "O" : "X";
    room.turn = room.starter;

    io.to(roomCode).emit("updateBoard", room.board);
    io.to(roomCode).emit("status", room.names[room.turn] + "'s turn");
  });

});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Server running"));