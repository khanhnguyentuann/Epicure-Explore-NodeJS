const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

router.get('/', async (req, res) => {
    try {
        const tags = await knex('tags').select('*');
        res.json(tags);
    } catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).json({ message: 'Error retrieving tags' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await knex('tags').where({ id: id }).first();
        if (tag) {
            res.json(tag);
        } else {
            res.status(404).json({ message: 'Tag not found' });
        }
    } catch (err) {
        console.error('Error fetching tag by id:', err);
        res.status(500).json({ message: 'Error retrieving tag' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        await knex('tags').insert({ tag_name: name });

        res.status(201).json({ message: 'Tag added successfully' });
    } catch (err) {
        console.error('Error adding tag:', err);
        res.status(500).json({ message: 'Error adding tag' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        await knex('tags').where({ id }).update({ tag_name: name });
        res.json({ message: 'Tag updated successfully' });
    } catch (err) {
        console.error('Error updating tag:', err);
        res.status(500).json({ message: 'Error updating tag' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await knex('tags').where({ id }).del();
        res.json({ success: true, message: 'Tag deleted successfully' });
    } catch (err) {
        console.error('Error deleting tag:', err);
        res.status(500).json({ success: false, message: 'Error deleting tag' });
    }
});


module.exports = router;
