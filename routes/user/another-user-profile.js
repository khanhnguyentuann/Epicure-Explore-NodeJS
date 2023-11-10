const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

router.get('/:userId', async (req, res) => {
    try {
        const userRecipes = await getUserRecipes(req.params.userId);
        res.json(userRecipes);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bài viết của người dùng:", error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách bài viết của người dùng' });
    }
});

async function getUserRecipes(userId) {
    const userRecipes = await knex('recipes').where('user_id', userId);

    const user = await knex('users').select('name', 'avatar').where('id', userId).first();

    const recipesDetails = await Promise.all(userRecipes.map(async (recipe) => {
        const [ingredients, tags, images] = await Promise.all([
            knex('recipe_ingredients')
                .select('ingredients.name', 'recipe_ingredients.amount')
                .join('ingredients', 'recipe_ingredients.ingredient_id', 'ingredients.id')
                .where('recipe_ingredients.recipe_id', recipe.id),
            knex('recipe_tags')
                .select('tags.tag_name')
                .join('tags', 'recipe_tags.tag_id', 'tags.id')
                .where('recipe_tags.recipe_id', recipe.id)
                .pluck('tag_name'),
            knex('recipe_images')
                .select('image_url')
                .where('recipe_id', recipe.id)
        ]);

        const isLikedByCurrentUser = await knex('post_likes_notifications')
            .where({
                user_id: userId,
                recipe_id: recipe.id,
            })
            .first();

        const totalLikes = await knex('post_likes_notifications')
            .where({ recipe_id: recipe.id })
            .count('* as count')
            .first();

        const commentsCount = await knex('comments')
            .where({ recipe_id: recipe.id })
            .orWhereIn('parent_id', knex.select('id').from('comments').where({ recipe_id: recipe.id }))
            .count('* as count')
            .first();

        recipe.images = images.map(img => img.image_url);
        // Chuyển đổi chuỗi steps thành mảng
        recipe.steps = JSON.parse(recipe.steps);

        return {
            ...recipe,
            user,
            timeAgo: recipe.created_at,
            steps: recipe.steps,
            ingredients,
            tags,
            isLikedByCurrentUser: Boolean(isLikedByCurrentUser),
            totalLikes: totalLikes.count,
            commentsCount: commentsCount.count,
        };
    }));

    return { user, recipes: recipesDetails };
}

module.exports = router;