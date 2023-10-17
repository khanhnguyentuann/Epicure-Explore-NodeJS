const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Fetch all recipes
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // lấy trang từ query, mặc định là trang 1
    const limit = 5; // mỗi trang 5 công thức
    const offset = (page - 1) * limit; // tính toán offset

    try {
        const recipes = await knex('recipes')
            .join('users', 'recipes.user_id', '=', 'users.id')
            .limit(limit)
            .offset(offset)
            .select('recipes.id', 'recipes.name', 'recipes.difficulty', 'users.name as creator', 'recipes.created_at');

        const totalCount = await knex('recipes').count('* as count'); // lấy tổng số công thức
        const totalPage = Math.ceil(totalCount[0].count / limit); // tính tổng số trang

        res.json({
            data: recipes,
            pagination: {
                current: page,
                total: totalPage,
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch recipes.' });
    }
});

// Delete a recipe
router.delete('/:recipeId', async (req, res) => {
    const recipeId = req.params.recipeId;

    try {
        // Xoá tất cả dữ liệu liên quan
        await knex('recipe_images').where('recipe_id', recipeId).del();
        await knex('post_likes_notifications').where('recipe_id', recipeId).del();
        await knex('favorite_recipes').where('recipe_id', recipeId).del();
        await knex('recipe_tags').where('recipe_id', recipeId).del();
        await knex('recipe_ingredients').where('recipe_id', recipeId).del();
        await knex('comments').where('recipe_id', recipeId).del();

        // Cuối cùng, xoá công thức
        await knex('recipes').where('id', recipeId).del();

        res.status(200).json({ message: 'Recipe deleted successfully.' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Could not delete recipe.' });
    }
});

// Fetch details for a specific recipe
router.get('/:recipeId', async (req, res) => {
    const recipeId = req.params.recipeId;

    try {
        // 1. Lấy thông tin cơ bản của công thức
        const recipeDetails = await knex('recipes')
            .where('recipes.id', recipeId)
            .join('users', 'recipes.user_id', '=', 'users.id')
            .select(
                'recipes.id', 'recipes.name', 'recipes.preparationTime', 'recipes.steps', 'recipes.difficulty',
                'recipes.servingFor', 'recipes.cookingTime', 'users.name as creator', 'recipes.created_at'
            )
            .first();

        // 2. Lấy tất cả nguyên liệu cho công thức
        const ingredients = await knex('recipe_ingredients')
            .where('recipe_id', recipeId)
            .join('ingredients', 'recipe_ingredients.ingredient_id', '=', 'ingredients.id')
            .select('ingredients.name', 'recipe_ingredients.amount');

        // 3. Lấy tất cả tags cho công thức
        const tags = await knex('recipe_tags')
            .where('recipe_id', recipeId)
            .join('tags', 'recipe_tags.tag_id', '=', 'tags.id')
            .select('tags.tag_name');

        // 4. Lấy tất cả hình ảnh cho công thức
        const images = await knex('recipe_images')
            .where('recipe_id', recipeId)
            .select('image_url');

        // Kết hợp tất cả dữ liệu
        recipeDetails.ingredients = ingredients;
        recipeDetails.tags = tags.map(tag => tag.tag_name);
        recipeDetails.images = images.map(img => img.image_url);

        res.json(recipeDetails);
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        res.status(500).json({ error: 'Could not fetch recipe details.' });
    }
});

module.exports = router;
