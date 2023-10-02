const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Middleware to handle errors
const handleErrors = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Đếm số thông báo "like" cho một người dùng cụ thể
router.get('/like-notifications-count', handleErrors(async (req, res) => {
    const userId = req.query.userId;
    // const { userId } = req.query;
    const count = await knex('post_likes_notifications')
        .where({
            user_id: userId,
            is_read: false  // chỉ đếm thông báo chưa đọc
        })
        .count('* as count')
        .first();

    res.json({ count: count.count });
}));

module.exports = router;
