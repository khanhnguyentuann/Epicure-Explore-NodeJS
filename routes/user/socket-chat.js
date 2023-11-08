const { Server } = require("socket.io");
const knexConfig = require('../../knexfile').development;
const knex = require('knex')(knexConfig);

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:8080",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {

        socket.on('join conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} has joined conversation ${conversationId}`);
        });

        socket.on('chat message', async (msg) => {
            try {
                console.log('Nhận được tin nhắn:', msg);
                const [newMessageId] = await knex('messages').insert({
                    conversation_id: msg.conversationId,
                    sender_id: msg.senderId,
                    content: msg.content,
                    sent_at: knex.fn.now()
                });

                const newMessage = await knex('messages').where('id', newMessageId).first();

                console.log('Tin nhắn đã được lưu và đang gửi:', newMessage);
                io.to(msg.conversationId).emit('chat message', newMessage);
            } catch (error) {
                console.error('Lỗi khi lưu tin nhắn', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Người dùng đã ngắt kết nối');
        });
    });

    return io;
}

module.exports = setupSocket;
