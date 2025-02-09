// server.js
require('dotenv').config(); 

console.log('DATABASE_URL:', process.env.DATABASE_URL);
const express = require('express');
const next = require('next');
const http = require('http');
const { Server: SocketIO } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  const io = new SocketIO(httpServer, { path: '/socket.io' });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.all(/^\/(?!socket\.io).*/, (req, res) => handle(req, res));

  const port = process.env.PORT || 3000;
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Server running on http://localhost:${port}`);
  });
});
