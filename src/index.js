const express = require('express');
const { SERVER_PORT } = require('./config/server')

const app = express();
const http = require('http').createServer(app);
// 创建 socket
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

// 用哈希表用存储用户连接
const users = new Map();

io.on('connection', (socket) => {
    console.log('用户连接');

    // 用户登录
    socket.on('login', (userId) => {
        users.set(userId, socket.id);
        socket.userId = userId;
        console.log(`用户 ${userId} 登录`);

        // 通知其他用户该用户上线
        socket.broadcast.emit('friend online', userId);
    });

    // 私聊消息
    socket.on('private message', ({to, message}) => {
        const receiverSocket = users.get(to);
        if (receiverSocket) {
            io.to(receiverSocket).emit('private message', {
                from: socket.userId,
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

                // 通知其他用户该用户离线
                socket.broadcast.emit('friend offline', userId);
                break;
            }
        }
    });
});

http.listen(SERVER_PORT, () => {
    console.log(`服务器(socket)运行成功🚀🚀🚀,端口:${SERVER_PORT}`);
});