const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 環境変数からポート番号を取得（Render.com用）
const port = process.env.PORT || 3000;

// blockColorsとkeywordGroupsの定義を追加
const blockColors = [/* カラーコードの配列 */];
const keywordGroups = [
  ["水族館"],
  ["フリッパープール"],
  ["イルカ"],
  ["黄色", "オレンジ", "屋根"],
  ["青"],
  ["水面", "水"],
  ["2人"],
  ["女性", "人"],
  ["飼育員"],
  ["スタッフ"],
  ["木"]
];

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
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});