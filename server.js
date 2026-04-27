const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static("public"));

const rooms = {};

// Winner check function
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

  if (!board.includes("")) return "draw";
  return null;
}

io.on("connection", (socket) => {

  // Create Room
  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomCode] = {
      board: ["", "", "", "", "", "", "", "", ""],
      currentTurn: "X",
      players: {
        X: socket.id,
        O: null
      }
    };

    socket.join(roomCode);

    socket.emit("roomCreated", {
      roomCode,
      symbol: "X"
    });
  });

  // Join Room
  socket.on("joinRoom", (roomCode) => {
    roomCode = roomCode.toUpperCase();

    const room = rooms[roomCode];

    if (!room) {
      socket.emit("gameOver", { message: "Room not found!" });
      return;
    }

    if (room.players.O) {
      socket.emit("gameOver", { message: "Room is full!" });
      return;
    }

    room.players.O = socket.id;

    socket.join(roomCode);

    socket.emit("roomJoined", {
      roomCode,
      symbol: "O"
    });

    io.to(roomCode).emit("updateBoard", {
      board: room.board,
      currentTurn: room.currentTurn
    });
  });

  // Make Move
  socket.on("makeMove", ({ roomCode, index, symbol }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.currentTurn !== symbol) return;
    if (room.board[index] !== "") return;

    room.board[index] = symbol;

    const result = checkWinner(room.board);

    if (result) {
      io.to(roomCode).emit("updateBoard", {
        board: room.board,
        currentTurn: room.currentTurn
      });

      if (result === "draw") {
        io.to(roomCode).emit("gameOver", {
          message: "It's a Draw!"
        });
      } else {
        io.to(roomCode).emit("gameOver", {
          message: `${result} Wins!`
        });
      }

      return;
    }

    room.currentTurn = room.currentTurn === "X" ? "O" : "X";

    io.to(roomCode).emit("updateBoard", {
      board: room.board,
      currentTurn: room.currentTurn
    });
  });

  // Restart Game
  socket.on("restartGame", (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.board = ["", "", "", "", "", "", "", "", ""];
    room.currentTurn = "X";

    io.to(roomCode).emit("restartBoard");
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      if (room.players.X === socket.id) {
        delete rooms[roomCode];
      }

      if (room.players.O === socket.id) {
        room.players.O = null;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});