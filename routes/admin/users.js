const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const config = require('../../knexfile').development;
const knex = require('knex')(config);
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');  // Đường dẫn nơi bạn muốn lưu file
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const upload = multer({ storage: storage });


// Fetch all users
router.get('/', async (req, res) => {
    try {
        const users = await knex('users').select('id', 'name', 'email', 'avatar', 'join_date', 'role', 'avatar');
        res.json(users);
    } catch (err) {
        console.error('Error in fetching users:', err);
        res.status(500).json({ message: 'Error retrieving users' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await knex('users').where({ id: id }).first();
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching user by id:', err);
        res.status(500).json({ message: 'Error retrieving user' });
    }
});


router.post('/', upload.single('avatar'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Mã hoá mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            avatar: 'uploads/default-avatar.png'
        };

        if (req.file && req.file.path) {
            newUser.avatar = req.file.path;
        }

        await knex('users').insert(newUser);
        res.status(201).json({ message: 'User added successfully' });
    } catch (err) {
        console.error('Error in adding user:', err);
        res.status(500).json({ message: 'Error adding user' });
    }
});

router.put('/:id', upload.single('avatar'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        let updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (email !== undefined) {
            updateData.email = email;
        }

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (req.file && req.file.path) {
            updateData.avatar = req.file.path;
        }

        if (Object.keys(updateData).length > 0) {
            await knex('users').where({ id: id }).update(updateData);
            res.json({ message: 'User updated successfully' });
        } else {
            res.json({ message: 'No fields provided for update' });
        }
    } catch (err) {
        console.error('Error in updating user:', err);
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await knex('users').where({ id: id }).del();

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error in deleting user:', err);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router;
