const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// 用于存储用户连接
const users = new Map();

io.on('connection', (socket) => {
    console.log('用户连接');

    // 用户登录
    socket.on('login', (userId) => {
        users.set(userId, socket.id);
        console.log(`用户 ${userId} 登录`);
    });

    // 私聊消息
    socket.on('private message', ({ to, message }) => {
        const receiverSocket = users.get(to);
        if (receiverSocket) {
            io.to(receiverSocket).emit('private message', {
                from: socket.id,
                message: message
            });
        }
    });

    socket.on('disconnect', () => {
        // 从用户列表中移除断开连接的用户
        for (let [userId, socketId] of users.entries()) {
            if (socketId === socket.id) {
                users.delete(userId);
                console.log(`用户 ${userId} 断开连接`);
                break;
            }
        }
    });
});

http.listen(3001, () => {
    console.log(`socket服务器运行在 http://localhost:3001`);
});