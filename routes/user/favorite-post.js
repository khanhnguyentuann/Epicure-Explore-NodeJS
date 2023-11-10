const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const savedRecipes = await knex('favorite_recipes')
            .where('favorite_recipes.user_id', userId)
            .join('recipes', 'favorite_recipes.recipe_id', 'recipes.id')
            .leftJoin('recipe_images', function () {
                this.on('favorite_recipes.recipe_id', '=', 'recipe_images.recipe_id')
                    .onIn('recipe_images.id', knex.raw('SELECT min(id) FROM recipe_images GROUP BY recipe_id'))
            })
            .select('recipes.*', 'recipe_images.image_url as firstImage')
            .orderBy('recipes.id', 'asc');

        res.json(savedRecipes);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách công thức đã lưu:', error.message);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách công thức đã lưu', error: error.message });
    }
});


router.post('/:id', async (req, res) => {
    try {
        const userId = req.body.userId;
        const recipeId = req.params.id;

        await knex('favorite_recipes').insert({
            user_id: userId,
            recipe_id: recipeId
        });

        res.json({ message: 'Bài viết đã được lưu' });
    } catch (error) {
        console.error('Lỗi khi lưu bài viết:', error);
        res.status(500).json({ message: 'Lỗi khi lưu bài viết' });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const userId = req.query.userId;
        const recipeId = req.params.id;

        await knex('favorite_recipes')
            .where('user_id', userId)
            .where('recipe_id', recipeId)
            .del();

        res.json({ message: 'Bài viết đã được xóa khỏi danh sách đã lưu' });
    } catch (error) {
        console.error('Lỗi khi xóa bài viết khỏi danh sách đã lưu:', error);
        res.status(500).json({ message: 'Lỗi khi xóa bài viết khỏi danh sách đã lưu' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const userId = req.query.userId;
        const recipeId = req.params.id;
        const recipe = await knex('recipes').select('*').where('id', recipeId).first();

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

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
            .orWhereIn('parent_id', knex.select('id').from('comments').where({ recipe_id: recipe.id }))
            .count('* as count')
            .first();

        const images = await knex('recipe_images')
            .select('image_url')
            .where('recipe_id', recipe.id);
        recipe.images = images.map(img => img.image_url);

        res.json({
            ...recipe,
            user,
            ingredients,
            tags,
            created_at: recipe.created_at,
            steps: recipe.steps,
            isLikedByCurrentUser: Boolean(isLikedByCurrentUser),
            totalLikes: totalLikes.count,
            commentsCount: commentsCount.count,
        });
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết recipe:", error);
        res.status(500).json({ message: 'Lỗi khi lấy chi tiết recipe' });
    }
});

module.exports = router;
