const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// GET request to retrieve id, name, and total number of comments for recipes with comments
router.get('/recipes-with-comments', async (req, res) => {
    try {
        const recipesWithComments = await knex('recipes')
            .select('recipes.id', 'recipes.name')
            .count('comments.id as totalComments')
            .leftJoin('comments', 'recipes.id', 'comments.recipe_id')
            .groupBy('recipes.id', 'recipes.name')
            .having('totalComments', '>', 0);

        res.json(recipesWithComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
});

router.get('/:recipeId', async (req, res) => {
    const { recipeId } = req.params; // Lấy id từ params

    try {
        const comments = await knex('comments')
            .where('recipe_id', recipeId)
            .select('id', 'content', 'created_at', 'user_id');

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching comments.' });
    }
});

router.delete('/api/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        await knex('comments').where({ id: commentId }).del();
        res.json({ success: true, message: 'Comment deleted successfully' });

    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ success: false, message: 'Error deleting comment' });
    }
});

module.exports = router;
