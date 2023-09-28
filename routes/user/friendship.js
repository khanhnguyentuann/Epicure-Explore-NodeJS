const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);


// Api lấy danh sách bạn bè
router.get('/friends', async (req, res) => {
    try {
        const { userId } = req.query;

        const friends = await knex('friendships')
            .join('users as user1', 'user1.id', 'friendships.user_id1')
            .join('users as user2', 'user2.id', 'friendships.user_id2')
            .where(function () {
                this.where('friendships.user_id1', userId).andWhere('friendships.status', 'accepted')
            })
            .orWhere(function () {
                this.where('friendships.user_id2', userId).andWhere('friendships.status', 'accepted')
            })
            .select([
                'user1.id as user1_id', 'user1.name as user1_name', 'user1.avatar as user1_avatar',
                'user2.id as user2_id', 'user2.name as user2_name', 'user2.avatar as user2_avatar'
            ]);


        const formattedFriends = friends.map(friend => ({
            id: friend.user1_id === parseInt(userId) ? friend.user2_id : friend.user1_id,
            name: friend.user1_id === parseInt(userId) ? friend.user2_name : friend.user1_name,
            avatar: friend.user1_id === parseInt(userId) ? friend.user2_avatar : friend.user1_avatar,
        }));

        res.json(formattedFriends);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Api lấy tất cả yêu cầu kết bạn
router.get('/requests', async (req, res) => {
    try {
        const { userId } = req.query;
        const requests = await knex('friendships')
            .join('users', 'users.id', 'friendships.user_id1')
            .where({ user_id2: userId, status: 'pending' })
            .select('users.name', 'users.avatar', 'friendships.user_id1', 'friendships.status', 'friendships.created_at');

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Api lấy trạng thái kết bạn
router.get('/status', async (req, res) => {
    try {
        const { userId1, userId2 } = req.query;
        const [friendship] = await knex('friendships')
            .where({ user_id1: userId1, user_id2: userId2 })
            .orWhere({ user_id1: userId2, user_id2: userId1 });

        let direction;
        if (friendship) {
            direction = friendship.user_id1 === parseInt(userId1) ? 'outgoing' : 'incoming';
        }

        res.json({ status: friendship ? friendship.status : 'none', direction });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Api gửi yêu cầu kết bạn
router.post('/send-request', async (req, res) => {
    try {
        const { userId1, userId2 } = req.body;
        await knex('friendships').insert({ user_id1: userId1, user_id2: userId2, status: 'pending' });
        res.status(201).send('Friend request sent');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Api xóa lời mời kết bạn, huỷ gửi yêu cầu kết bạn
router.delete('/cancel-request', async (req, res) => {
    try {
        const userId1 = Number(req.query.userId1);
        const userId2 = Number(req.query.userId2);

        if (isNaN(userId1) || isNaN(userId2)) {
            return res.status(400).send('Invalid user IDs');
        }

        // Delete the friend request
        await knex('friendships')
            .where({ user_id1: userId1, user_id2: userId2, status: 'pending' })
            .orWhere({ user_id1: userId2, user_id2: userId1, status: 'pending' })
            .del();

        res.status(200).send('Friend request cancelled');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Api chấp nhận kết bạn
router.post('/accept-request', async (req, res) => {
    try {
        const { userId1, userId2 } = req.body;

        await knex('friendships')
            .where({ user_id1: userId1, user_id2: userId2 })
            .orWhere({ user_id1: userId2, user_id2: userId1 })
            .update({ status: 'accepted' });

        res.status(200).send('Friend request accepted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Api hủy kết bạn
router.delete('/unfriend', async (req, res) => {
    try {
        const { userId1, userId2 } = req.query;

        await knex('friendships')
            .where({ user_id1: userId1, user_id2: userId2, status: 'accepted' })
            .orWhere({ user_id1: userId2, user_id2: userId1, status: 'accepted' })
            .del();

        res.status(200).send('Unfriended successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;