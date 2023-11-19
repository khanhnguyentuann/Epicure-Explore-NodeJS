const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Endpoint tạo một cuộc trò chuyện mới.
router.post('/create-conversation', async (req, res) => {
    const { user1_id, user2_id } = req.body;

    try {
        // Tạo cuộc trò chuyện mới và lưu vào database
        const [newConversation] = await knex('conversations').insert({
            user1_id: user1_id,
            user2_id: user2_id
        }).returning('*');

        // Trả về thông tin về cuộc trò chuyện mới
        res.json(newConversation);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});


// Endpoint để kiểm tra cuộc trò chuyện
router.get('/conversation-check', async (req, res) => {
    const { user1_id, user2_id } = req.query;

    try {
        // Logic để kiểm tra cuộc trò chuyện
        const existingConversation = await knex('conversations')
            .where({ user1_id, user2_id })
            .orWhere({ user1_id: user2_id, user2_id: user1_id })
            .first();

        if (existingConversation) {
            res.json(existingConversation);
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});

// Endpoint để Lấy Tất Cả Cuộc Trò Chuyện của Người Dùng cùng thông tin đối phương
router.get('/get-user-conversations/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const conversations = await knex('conversations')
            .where({ user1_id: userId })
            .orWhere({ user2_id: userId })
            .select('conversations.*')
            .then(async conversations => {
                const enhancedConversations = await Promise.all(conversations.map(async conversation => {
                    // Lấy tin nhắn gần nhất của cuộc trò chuyện
                    const latestMessage = await knex('messages')
                        .where({ conversation_id: conversation.id })
                        .orderBy('sent_at', 'desc')
                        .select('content')
                        .first();

                    // Xác định ID của người dùng đối diện
                    const otherUserId = conversation.user1_id === parseInt(userId) ? conversation.user2_id : conversation.user1_id;

                    // Lấy thông tin người dùng đối diện
                    const otherUser = await knex('users').where({ id: otherUserId }).first();

                    // Thêm thông tin người dùng đối diện và tin nhắn gần nhất vào cuộc trò chuyện
                    return {
                        ...conversation,
                        otherUserName: otherUser.name,
                        otherUserAvatar: otherUser.avatar,
                        otherUserId: otherUser.id,
                        latestMessage: latestMessage ? latestMessage.content : null,
                    };
                }));

                res.json(enhancedConversations);
            });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});

module.exports = router;

