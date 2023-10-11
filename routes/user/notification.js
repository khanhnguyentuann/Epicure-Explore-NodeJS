const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Middleware to handle errors
const handleErrors = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Đánh dấu tất cả thông báo "like" là đã đọc cho một người dùng cụ thể
router.post('/mark-all-as-read', handleErrors(async (req, res) => {
    const userId = req.body.userId;

    await knex('post_likes_notifications')
        .where({
            user_id: userId,
            is_read: false
        })
        .update({
            is_read: true
        });

    res.json({ success: true });
}));


// Đếm số thông báo "like" đã được nhóm cho một người dùng cụ thể
router.get('/like-notifications-count', handleErrors(async (req, res) => {
    const userId = req.query.userId;

    const groupedNotifications = await knex('post_likes_notifications')
        .where({
            user_id: userId,
            is_read: false
        })
        .whereNot({
            sender_id: userId  // loại bỏ trường hợp người dùng tự like
        })
        .groupBy('recipe_id')
        .select('recipe_id');


    // Số lượng thông báo nhóm là số lượng nhóm tạo ra
    const count = groupedNotifications.length;

    res.json({ count });
}));


// Truy xuất tất cả thông báo like chưa đọc cho một người dùng cụ thể
router.get('/unread-like-notifications', handleErrors(async (req, res) => {
    const userId = req.query.userId;

    const notifications = await knex('post_likes_notifications')
        .join('users', 'post_likes_notifications.sender_id', 'users.id')
        .where({
            user_id: userId,
            is_read: false
        })
        .whereNot({
            sender_id: userId // điều kiện này để loại trừ người dùng tự like
        })
        .select(
            'post_likes_notifications.id',
            'recipe_id',
            'sender_id',
            'users.name as sender_name',
            'users.avatar as sender_avatar',  // Thêm dòng này
            'created_at'
        )
        .orderBy('created_at', 'desc');

    const groupedNotifications = {};

    notifications.forEach(notification => {
        const recipeId = notification.recipe_id;
        if (!groupedNotifications[recipeId]) {
            groupedNotifications[recipeId] = {
                recipe_id: recipeId,
                sender_ids: [],
                sender_names: [],
                sender_avatars: [],
                created_at: notification.created_at, // Thêm dòng này
                count: 0,
            };
        } else {
            // Cập nhật trường created_at nếu thời gian của thông báo mới hơn
            if (notification.created_at > groupedNotifications[recipeId].created_at) {
                groupedNotifications[recipeId].created_at = notification.created_at;
            }
        }
        groupedNotifications[recipeId].sender_avatars.push(notification.sender_avatar);
        groupedNotifications[recipeId].sender_ids.push(notification.sender_id);
        groupedNotifications[recipeId].sender_names.push(notification.sender_name);
        groupedNotifications[recipeId].count += 1;
    });

    const formattedNotifications = Object.values(groupedNotifications).map(group => {
        const responseObj = {
            recipe_id: group.recipe_id,
            last_sender_id: group.sender_ids[0],  // ID của người gửi gần đây nhất
            last_sender_name: group.sender_names[0],  // Tên của người gửi gần đây nhất
            last_sender_avatar: group.sender_avatars[0],
            last_like_time: group.created_at,
            count: group.count
        };

        if (group.count > 1) {
            responseObj.second_last_sender_name = group.sender_names[1];  // Tên của người gửi thứ hai gần đây nhất
        }

        if (group.count > 2) {
            responseObj.third_last_sender_name = group.sender_names[2];  // Tên của người gửi thứ ba gần đây nhất
        }

        return responseObj;
    });

    res.json(formattedNotifications);
}));

module.exports = router;
