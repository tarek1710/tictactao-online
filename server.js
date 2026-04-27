const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static("public"));

const rooms = {};

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

  if (!board.includes("")) return "draw";
  return null;
}

io.on("connection", (socket) => {

  socket.on("createRoom", (name) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomCode] = {
      board: ["","","","","","","","",""],
      currentTurn: "X",
      starter: "X",
      gameOver: false,
      names: {
        X: name,
        O: ""
      },
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

  socket.on("joinRoom", ({ roomCode, name }) => {
    roomCode = roomCode.toUpperCase();

    const room = rooms[roomCode];
    if (!room) {
      socket.emit("gameOver", { message: "Room not found!" });
      return;
    }

    if (room.players.O) {
      socket.emit("gameOver", { message: "Room full!" });
      return;
    }

    room.players.O = socket.id;
    room.names.O = name;

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

  socket.on("makeMove", ({ roomCode, index, symbol }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.gameOver) return;
    if (room.currentTurn !== symbol) return;
    if (room.board[index] !== "") return;

    room.board[index] = symbol;

    const result = checkWinner(room.board);

    if (result) {
      room.gameOver = true;

      io.to(roomCode).emit("updateBoard", {
        board: room.board,
        currentTurn: room.currentTurn
      });

      io.to(roomCode).emit("gameOver", {
        message: result === "draw"
          ? "It's a Draw!"
          : `${room.names[result]} Wins!`
      });

      return;
    }

    room.currentTurn = room.currentTurn === "X" ? "O" : "X";

    io.to(roomCode).emit("updateBoard", {
      board: room.board,
      currentTurn: room.currentTurn
    });
  });

  socket.on("restartGame", (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (!room.gameOver) return;

    room.board = ["","","","","","","","",""];
    room.gameOver = false;

    room.starter = room.starter === "X" ? "O" : "X";
    room.currentTurn = room.starter;

    io.to(roomCode).emit("updateBoard", {
      board: room.board,
      currentTurn: room.currentTurn
    });
  });

  socket.on("disconnect", () => {
    for (let roomCode in rooms) {
      const room = rooms[roomCode];

      if (room.players.X === socket.id) delete rooms[roomCode];
      if (room.players.O === socket.id) room.players.O = null;
    }
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));