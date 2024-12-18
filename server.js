const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 静的ファイルの提供
app.use(express.static('public'));

// 接続クライアントの管理
const clients = new Set();

// Socket.IO接続処理
io.on('connection', (socket) => {
  clients.add(socket);
  console.log(`クライアント接続 (計${clients.size}件)`);

  // 初期状態の送信
  socket.emit('init', {
    blockColors: blockColors,
    keywordGroups: keywordGroups
  });

  // 入力更新の処理
  socket.on('input', (data) => {
    socket.broadcast.emit('update', data);
  });

  // 切断処理
  socket.on('disconnect', () => {
    clients.delete(socket);
    console.log(`クライアント切断 (残${clients.size}件)`);
  });
});

// サーバー起動
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});