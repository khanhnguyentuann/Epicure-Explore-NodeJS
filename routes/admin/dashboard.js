const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

// Route to get the total number of registered users
router.get('/total-users', async (req, res) => {
    try {
        const result = await knex('users').count('id as totalUsers').first();
        const totalUsers = result.totalUsers;
        res.json({ totalUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get the total number of hashtags
router.get('/total-hashtags', async (req, res) => {
    try {
        const result = await knex('tags').count('id as totalHashtags').first();
        const totalHashtags = result.totalHashtags;
        res.json({ totalHashtags });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get the total number of posts
router.get('/total-posts', async (req, res) => {
    try {
        const result = await knex('recipes').count('id as totalPosts').first();
        const totalPosts = result.totalPosts;
        res.json({ totalPosts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get the total number of ingredients
router.get('/total-ingredients', async (req, res) => {
    try {
        const result = await knex('ingredients').count('id as totalIngredients').first();
        const totalIngredients = result.totalIngredients;
        res.json({ totalIngredients });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get the total number of comments
router.get('/total-comments', async (req, res) => {
    try {
        const result = await knex('comments').count('id as totalComments').first();
        const totalComments = result.totalComments;
        res.json({ totalComments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;