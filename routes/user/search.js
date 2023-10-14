const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Search recipes by tags
const searchByTag = async (req, res) => {
    const tagString = req.query.tag;
    const tags = tagString.split(',').map(tag => tag.trim());
    try {
        const recipes = await knex('recipes')
            .join('recipe_tags', 'recipes.id', '=', 'recipe_tags.recipe_id')
            .join('tags', 'tags.id', '=', 'recipe_tags.tag_id')
            .whereIn('tags.tag_name', tags)
            .distinct('recipes.id', 'recipes.name')
            .select('recipes.*');
        res.status(200).json({ recipes });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Search recipes by title
const searchByTitle = async (req, res) => {
    const title = req.query.title;
    const keywords = title.toLowerCase().split(' ').map(word => `%${word}%`);
    try {
        const query = knex('recipes').select('id', 'name', 'preparationTime', 'difficulty');
        if (keywords.length > 0) {
            // xây dựng một hoặc nhiều điều kiện tìm kiếm trả về các bài viết có chứa ít nhất một từ khóa.
            query.where(function () {
                keywords.forEach((keyword, index) => {
                    if (index === 0) {
                        this.where(knex.raw('LOWER(name) LIKE ?', [keyword]));
                    } else {
                        this.orWhere(knex.raw('LOWER(name) LIKE ?', [keyword]));
                    }
                });
            });
        }
        const recipes = await query;
        res.status(200).json({ recipes });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get all tags
const getAllTags = async (req, res) => {
    try {
        const tags = await knex('tags').select('id', 'tag_name');
        res.status(200).json({ tags });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllIngredients = async (req, res) => {
    try {
        const ingredients = await knex('ingredients').select('*');
        res.status(200).json({ ingredients });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nguyên liệu:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const searchByIngredients = async (req, res) => {
    const ingredientString = req.query.ingredients;
    const ingredients = ingredientString.split(',').map(ingredient => ingredient.trim());

    try {
        const recipes = await knex('recipes')
            .join('recipe_ingredients', 'recipes.id', '=', 'recipe_ingredients.recipe_id')
            .join('ingredients', 'ingredients.id', '=', 'recipe_ingredients.ingredient_id')
            .whereIn('ingredients.name', ingredients)
            .distinct('recipes.id', 'recipes.name')
            .select('recipes.*');
        res.status(200).json({ recipes });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Define routes
router.get('/searchByTag', searchByTag);
router.get('/searchByTitle', searchByTitle);
router.get('/getAllTags', getAllTags);
router.get('/getAllIngredients', getAllIngredients);
router.get('/searchByIngredients', searchByIngredients);

module.exports = router;
