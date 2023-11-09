const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Middleware to handle errors
const handleErrors = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Lấy tất cả công thức ( bài viết )
router.get('/all', handleErrors(async (req, res) => {
    const { userId } = req.query;
    const newfeedRecipes = await knex('recipes').select('*').orderBy('created_at', 'DESC');

    const recipesWithInfo = await Promise.all(newfeedRecipes.map(async (recipe) => {
        const user = await knex('users').select('name', 'avatar').where('id', recipe.user_id).first();

        const ingredients = await knex('recipe_ingredients')
            .select('ingredients.name', 'recipe_ingredients.amount')
            .join('ingredients', 'recipe_ingredients.ingredient_id', 'ingredients.id')
            .where('recipe_ingredients.recipe_id', recipe.id);

        const tags = await knex('recipe_tags')
            .select('tags.tag_name')
            .join('tags', 'recipe_tags.tag_id', 'tags.id')
            .where('recipe_tags.recipe_id', recipe.id)
            .pluck('tag_name');

        // Chuyển đổi chuỗi steps thành mảng
        recipe.steps = JSON.parse(recipe.steps);

        const isLikedByCurrentUser = await knex('post_likes_notifications')
            .where({
                sender_id: userId,
                recipe_id: recipe.id,
            })
            .first();

        const totalLikes = await knex('post_likes_notifications')
            .where({ recipe_id: recipe.id })
            .count('* as count')
            .first();

        const commentsCount = await knex('comments')
            .where({ recipe_id: recipe.id })
            .count('* as count')
            .first();

        const images = await knex('recipe_images')
            .select('image_url')
            .where('recipe_id', recipe.id);
        recipe.images = images.map(img => img.image_url);

        return {
            ...recipe,
            created_at: recipe.created_at,
            user,
            ingredients,
            steps: recipe.steps,
            tags,
            isLikedByCurrentUser: Boolean(isLikedByCurrentUser),
            totalLikes: totalLikes.count,
            commentsCount: commentsCount.count,
        };
    }));

    res.json(recipesWithInfo);
}));

// Xóa một công thức ( bài viết )
router.delete('/delete/:id', handleErrors(async (req, res) => {
    const { id: recipeId } = req.params;
    await knex.transaction(async transaction => {
        await transaction('recipe_ingredients').where('recipe_id', recipeId).del();
        await transaction('recipe_tags').where('recipe_id', recipeId).del();
        await transaction('favorite_recipes').where('recipe_id', recipeId).del();
        await transaction('comments').where('recipe_id', recipeId).del();
        await transaction('post_likes_notifications').where('recipe_id', recipeId).del();
        await transaction('recipe_images').where('recipe_id', recipeId).del();
        await transaction('recipes').where('id', recipeId).del();
    });
    res.json({ message: 'Bài viết đã được xoá' });
}));


router.get('/:recipeId/comments', async (req, res) => {
    try {
        const { recipeId } = req.params;

        // Lấy tất cả bình luận (bao gồm cả gốc và con) cho recipeId
        let comments = await knex('comments')
            .join('users', 'users.id', 'comments.user_id')
            .where('recipe_id', recipeId)
            .orWhereIn('parent_id', knex.select('id').from('comments').where('recipe_id', recipeId))
            .select('comments.*', 'users.name as userName', 'users.avatar as userAvatar');

        let commentMap = {};

        comments.forEach(comment => {
            if (comment.recipe_id) { // Nếu comment có giá trị recipe_id
                comment.replies = [];
                commentMap[comment.id] = comment;
            }
        });

        comments.forEach(comment => {
            if (comment.parent_id && commentMap[comment.parent_id]) {
                commentMap[comment.parent_id].replies.push(comment);
            }
        });

        // Lọc ra các bình luận gốc
        const organizedComments = Object.values(commentMap).filter(comment => !comment.parent_id);

        res.json(organizedComments);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//  Thêm bình luận mới cho một công thức.
router.post('/:recipeId/comments', handleErrors(async (req, res) => {
    const { params: { recipeId }, body: { userId, content } } = req;
    await knex('comments').insert({ user_id: userId, recipe_id: recipeId, content });
    res.status(201).send({ message: 'Comment added successfully' });
}));

// Thêm trả lời cho một bình luận
router.post('/comments/:commentId/replies', handleErrors(async (req, res) => {
    const { params: { commentId }, body: { userId, content } } = req; // sử dụng nested destructuring
    await knex('comments').insert({ user_id: userId, content, parent_id: commentId });
    res.status(201).send({ message: 'Reply added successfully' });
}));

// Thích một công thức
router.post('/like/:recipeId', handleErrors(async (req, res) => {
    const { params: { recipeId }, body: { sender_id } } = req;
    // Lấy user_id của người đã đăng công thức
    const postOwner = await knex('recipes').select('user_id').where('id', recipeId).first();

    // Kiểm tra xem người dùng này đã thích bài viết này chưa
    const existingLike = await knex('post_likes_notifications').where({ sender_id: sender_id, recipe_id: recipeId }).first();
    if (existingLike) {
        return res.status(400).send({ message: 'You already liked this recipe' });
    }

    await knex('post_likes_notifications').insert({ sender_id: sender_id, recipe_id: recipeId, user_id: postOwner.user_id });
    res.status(200).send({ message: 'Recipe liked successfully' });
}));

// Bỏ thích một công thức
router.delete('/unlike/:recipeId', handleErrors(async (req, res) => {
    const { params: { recipeId }, body: { sender_id } } = req;

    // Lấy user_id của người đã đăng công thức
    const postOwner = await knex('recipes').select('user_id').where('id', recipeId).first();
    await knex('post_likes_notifications').where({ sender_id: sender_id, recipe_id: recipeId, user_id: postOwner.user_id }).delete();
    res.status(200).send({ message: 'Recipe unliked successfully' });
}));

module.exports = router;
