const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.get('/list-ingredients', async (req, res) => {
    try {
        const ingredients = await knex('ingredients').select('*');
        res.json(ingredients);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nguyên liệu:", error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách nguyên liệu' });
    }
});

router.post('/', upload.array('images', 10), async (req, res) => {
    try {
        const {
            name,
            preparationTime,
            steps,
            difficulty,
            tags,
            ingredients,
            user_id,
            servingFor,
            cookingTime,
        } = req.body;

        // Chuyển đổi mảng steps thành chuỗi JSON
        const stepsJSON = JSON.stringify(JSON.parse(steps));

        const [recipeId] = await knex('recipes').insert({
            name,
            preparationTime,
            steps: stepsJSON, // Sử dụng chuỗi JSON thay vì mảng
            difficulty,
            user_id,
            servingFor,
            cookingTime,
        });

        if (req.files.length > 0) {
            const imagesData = req.files.map(file => ({
                recipe_id: recipeId,
                image_url: file.path
            }));
            await knex('recipe_images').insert(imagesData);
        }

        const recipeIngredientsData = JSON.parse(ingredients).map(ingredient => ({
            recipe_id: recipeId,
            ingredient_id: ingredient.id,
            amount: ingredient.amount
        }));
        await knex('recipe_ingredients').insert(recipeIngredientsData);

        if (tags && JSON.parse(tags).length > 0) {
            const tagsToInsert = JSON.parse(tags);
            const tagIds = [];

            for (const tagName of tagsToInsert) {
                let tag = await knex('tags').where('tag_name', tagName).first();
                if (!tag) {
                    const [newTagId] = await knex('tags').insert({ tag_name: tagName });
                    tagIds.push(newTagId);
                } else {
                    tagIds.push(tag.id);
                }
            }

            const recipeTagsData = tagIds.map(tagId => ({
                recipe_id: recipeId,
                tag_id: tagId
            }));
            await knex('recipe_tags').insert(recipeTagsData);
        }

        res.status(201).json({ message: "Công thức đã được tạo thành công" });
    } catch (error) {
        console.error("Lỗi từ cơ sở dữ liệu:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi tạo công thức" });
    }
});

module.exports = router;
