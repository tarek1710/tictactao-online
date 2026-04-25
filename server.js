const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ফাইলগুলো যদি 'public' ফোল্ডারের ভেতর থাকে তবে এটি কাজ করবে
app.use(express.static(path.join(__dirname, 'public')));

// কেউ মেইন লিঙ্কে ঢুকলে তাকে public ফোল্ডারের index.html ফাইলটি দেখাবে
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let players = {}; 
let board = Array(9).fill(""); 

io.on('connection', (socket) => {
    console.log('প্লেয়ার কানেক্ট হয়েছে: ' + socket.id);

    // প্লেয়ার রোল অ্যাসাইন করা (X বা O)
    if (Object.keys(players).length === 0) {
        players[socket.id] = "X";
        socket.emit('playerRole', "X");
    } else if (Object.keys(players).length === 1) {
        players[socket.id] = "O";
        socket.emit('playerRole', "O");
    } else {
        socket.emit('playerRole', "Spectator");
    }

    // মুভ রিসিভ এবং ব্রডকাস্ট করা
    socket.on('move', (data) => {
        board[data.index] = data.symbol;
        socket.broadcast.emit('move', data);

        // জয়ী চেক করা
        const winner = checkWinner(board);
        if (winner) {
            io.emit('gameOver', winner);
            board = Array(9).fill(""); // গেম রিসেট
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log('প্লেয়ার ডিসকানেক্ট হয়েছে');
    });
});

// জয়ী নির্ধারণ করার লজিক
function checkWinner(board) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes("")) return "Draw";
    return null;
}

// পোর্ট কনফিগারেশন (Render-এর জন্য জরুরি)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Server is running on port ${PORT});
});