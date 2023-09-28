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

router.delete('/:userId/:recipeId', async (req, res) => {
    const { userId, recipeId } = req.params;

    try {
        const recipe = await getRecipeById(recipeId);
        if (!recipe || recipe.user_id != userId) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này' });
        }

        await deleteRecipe(recipeId);
        res.json({ message: 'Bài viết đã được xóa thành công' });
    } catch (error) {
        console.error("Lỗi khi xóa bài viết:", error);
        res.status(500).json({ message: 'Lỗi khi xóa bài viết' });
    }
});

async function getUserRecipes(userId) {
    const userRecipes = await knex('recipes').where('user_id', userId);

    return await Promise.all(userRecipes.map(async (recipe) => {
        const [user, ingredients, tags, images] = await Promise.all([
            knex('users').select('name', 'avatar').where('id', recipe.user_id).first(),
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

        const isLikedByCurrentUser = await knex('recipe_likes')
            .where({
                user_id: userId,
                recipe_id: recipe.id,
            })
            .first();

        const totalLikes = await knex('recipe_likes')
            .where({ recipe_id: recipe.id })
            .count('* as count')
            .first();

        const commentsCount = await knex('comments')
            .where({ recipe_id: recipe.id })
            .count('* as count')
            .first();


        recipe.images = images.map(img => img.image_url);
        // Chuyển đổi chuỗi steps thành mảng
        recipe.steps = JSON.parse(recipe.steps);

        return {
            ...recipe,
            timeAgo: recipe.created_at,
            steps: recipe.steps,
            user,
            ingredients,
            tags,
            isLikedByCurrentUser: Boolean(isLikedByCurrentUser),
            totalLikes: totalLikes.count,
            commentsCount: commentsCount.count,
        };
    }));
}

async function getRecipeById(recipeId) {
    return await knex('recipes').where('id', recipeId).first();
}

async function deleteRecipe(recipeId) {
    await knex.transaction(async transaction => {
        await transaction('recipe_ingredients').where('recipe_id', recipeId).del();
        await transaction('recipe_tags').where('recipe_id', recipeId).del();
        await transaction('favorite_recipes').where('recipe_id', recipeId).del();
        await transaction('recipes').where('id', recipeId).del();
    });
}

module.exports = router;