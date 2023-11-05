const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);

router.get('/:otherUserId', async (req, res) => {
    try {
        const otherUserId = req.params.otherUserId;
        const userChatInfo = await knex('users')
            .select('name', 'avatar')
            .where({ id: otherUserId })
            .first();

        if (!userChatInfo) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(userChatInfo);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});


module.exports = router;