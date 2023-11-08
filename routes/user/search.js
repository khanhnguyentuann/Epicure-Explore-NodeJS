const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Get all tags
const getAllTags = async (req, res) => {
    try {
        const tags = await knex('tags').select('id', 'tag_name');
        res.status(200).json({ tags });
    } catch (error) {
        handleRouteError(res, error);
    }
};

// Get all igredients
const getAllIngredients = async (req, res) => {
    try {
        const ingredients = await knex('ingredients').select('*');
        res.status(200).json({ ingredients });
    } catch (error) {
        handleRouteError(res, error);
    }
};

// Function to create a basic recipes query
const createBaseRecipesQuery = () => {
    return knex('recipes').select('recipes.id', 'recipes.name', 'recipes.cookingTime', 'recipes.servingFor').distinct('recipes.id');
};

// Helper function to add the first image to recipes
const addFirstImageToRecipes = async (recipesQuery) => {
    const recipesWithImages = await recipesQuery
        .leftJoin('recipe_images', function () {
            this.on('recipes.id', '=', 'recipe_images.recipe_id')
                .onIn('recipe_images.id', knex.raw('SELECT min(id) FROM recipe_images GROUP BY recipe_id'));
        })
        .select('recipe_images.image_url as firstImage');
    return recipesWithImages;
};

// Error handling helper function
const handleRouteError = (res, error) => {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
};

// Search recipes by tags
const searchByTag = async (req, res) => {
    const tagString = req.query.tag;
    const tags = tagString.split(',').map(tag => tag.trim());
    try {
        const baseQuery = createBaseRecipesQuery();
        const recipes = await addFirstImageToRecipes(
            baseQuery
                .join('recipe_tags', 'recipes.id', '=', 'recipe_tags.recipe_id')
                .join('tags', 'tags.id', '=', 'recipe_tags.tag_id')
                .whereIn('tags.tag_name', tags)
                .orderBy('recipes.id', 'asc')
        );
        res.status(200).json({ recipes });
    } catch (error) {
        handleRouteError(res, error);
    }
};

// Search recipes by title
const searchByTitle = async (req, res) => {
    const title = req.query.title;
    const keywords = title.toLowerCase().split(' ').map(word => `%${word}%`);
    try {
        const baseQuery = createBaseRecipesQuery()
            .where(function () {
                this.where(knex.raw('LOWER(recipes.name) LIKE ?', [keywords[0]]));
                for (let i = 1; i < keywords.length; i++) {
                    this.orWhere(knex.raw('LOWER(recipes.name) LIKE ?', [keywords[i]]));
                }
            });

        const recipes = await addFirstImageToRecipes(baseQuery);
        res.status(200).json({ recipes });
    } catch (error) {
        handleRouteError(res, error);
    }
};

// Search recipes by ingredients
const searchByIngredients = async (req, res) => {
    const ingredientString = req.query.ingredients;
    const ingredients = ingredientString.split(',').map(ingredient => ingredient.trim());

    try {
        const baseQuery = createBaseRecipesQuery()
            .join('recipe_ingredients', 'recipes.id', '=', 'recipe_ingredients.recipe_id')
            .join('ingredients', 'ingredients.id', '=', 'recipe_ingredients.ingredient_id')
            .whereIn('ingredients.name', ingredients);

        const recipes = await addFirstImageToRecipes(baseQuery);
        res.status(200).json({ recipes });
    } catch (error) {
        handleRouteError(res, error);
    }
};

// Define routes
router.get('/searchByTag', searchByTag);
router.get('/searchByTitle', searchByTitle);
router.get('/getAllTags', getAllTags);
router.get('/getAllIngredients', getAllIngredients);
router.get('/searchByIngredients', searchByIngredients);

module.exports = router;
