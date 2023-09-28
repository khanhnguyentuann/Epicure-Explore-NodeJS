const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

router.get('/', async (req, res) => {
    try {
        const ingredients = await knex('ingredients').select('*');
        res.json(ingredients);
    } catch (err) {
        console.error('Error fetching ingredients:', err);
        res.status(500).json({ message: 'Error retrieving ingredients' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ingredient = await knex('ingredients').where({ id: id }).first();
        if (ingredient) {
            res.json(ingredient);
        } else {
            res.status(404).json({ message: 'Ingredients not found' });
        }
    } catch (err) {
        console.error('Error fetching ingredient by id:', err);
        res.status(500).json({ message: 'Error retrieving ingredient' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        await knex('ingredients').insert({ name });

        res.status(201).json({ message: 'Ingredient added successfully' });
    } catch (err) {
        console.error('Error adding ingredient:', err);
        res.status(500).json({ message: 'Error adding ingredient' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        await knex('ingredients').where({ id }).update({ name });
        res.json({ message: 'Ingredient updated successfully' });
    } catch (err) {
        console.error('Error updating ingredient:', err);
        res.status(500).json({ message: 'Error updating ingredient' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await knex('ingredients').where({ id }).del();
        res.json({ success: true, message: 'Ingredient deleted successfully' });

    } catch (err) {
        console.error('Error deleting ingredient:', err);
        res.status(500).json({ success: false, message: 'Error deleting ingredient' });
    }
});


module.exports = router;
