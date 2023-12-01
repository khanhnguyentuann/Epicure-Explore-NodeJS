const express = require('express');
const router = express.Router();
const config = require('../../knexfile').development;
const knex = require('knex')(config);
const multer = require('multer');
const bcrypt = require('bcrypt');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');  // Đường dẫn nơi bạn muốn lưu file
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.put('/:userId', upload.single('avatar'), async (req, res) => {
    console.log('Received file:', req.file);
    console.log('Received form data:', req.body);
    try {
        const userId = req.params.userId;
        const user = await knex('users').where({ id: userId }).first();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let updatedUserInfo = {};

        // Check each field and update only if there are changes
        if (req.body.name) {
            updatedUserInfo.name = req.body.name;
        }
        if (req.body.email) {
            updatedUserInfo.email = req.body.email;
        }
        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            updatedUserInfo.password = hashedPassword;
        }
        if (req.file && req.file.path) {
            updatedUserInfo.avatar = req.file.path;
        }

        // Update only if there is new information
        if (Object.keys(updatedUserInfo).length > 0) {
            await knex('users').where({ id: userId }).update(updatedUserInfo);
            res.status(200).json({ message: 'User information updated successfully' });
        } else {
            res.status(400).json({ message: 'No information to update' });
        }
    } catch (error) {
        console.error('Error updating user information:', error);
        res.status(500).json({ message: 'Error updating user information' });
    }
});

// Route to get the avatar path based on userId
router.get('/get-new-avatar/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const avatar = await knex('users').where('id', userId).select('avatar').first();
        res.json({ avatar });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching avatar path' });
    }
});

router.get('/:userId', async (req, res) => {
    try {
        const userRecipes = await getUserRecipes(req.params.userId);
        res.json(userRecipes);
    } catch (error) {
        console.error("Error fetching user's recipe list:", error);
        res.status(500).json({ message: 'Error fetching user\'s recipe list' });
    }
});

router.delete('/:userId/:recipeId', async (req, res) => {
    const { userId, recipeId } = req.params;

    try {
        const recipe = await getRecipeById(recipeId);
        if (!recipe || recipe.user_id != userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this recipe' });
        }

        await deleteRecipe(recipeId);
        res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error("Error deleting recipe:", error);
        res.status(500).json({ message: 'Error deleting recipe' });
    }
});


async function getUserRecipes(userId) {
    const userRecipes = await knex('recipes').where('user_id', userId).orderBy('created_at', 'DESC');

    return await Promise.all(userRecipes.map(async (recipe) => {
        const [user, ingredients, tags, images] = await Promise.all([
            knex('users').select('name', 'avatar').where('id', recipe.user_id).first(),
            knex('recipe_ingredients')
                .select('ingredients.name', 'recipe_ingredients.amount')
                .join('ingredients', 'recipe_ingredients.ingredient_id', 'ingredients.id')
                .where('recipe_ingredients.recipe_id', recipe.id),
            knex('recipe_tags')
                .select('tags.tag_name')
                .join('tags', 'recipe_tags.tag_id', 'tags.id')
                .where('recipe_tags.recipe_id', recipe.id)
                .pluck('tag_name'),
            knex('recipe_images')
                .select('image_url')
                .where('recipe_id', recipe.id)
        ]);

        const isLikedByCurrentUser = await knex('post_likes_notifications')
            .where({
                user_id: userId,
                recipe_id: recipe.id,
            })
            .first();

        const totalLikes = await knex('post_likes_notifications')
            .where({ recipe_id: recipe.id })
            .count('* as count')
            .first();

        const commentsCount = await knex('comments')
            .where({ recipe_id: recipe.id })
            .orWhereIn('parent_id', knex.select('id').from('comments').where({ recipe_id: recipe.id }))
            .count('* as count')
            .first();

        recipe.images = images.map(img => img.image_url);
        // Chuyển đổi chuỗi steps thành mảng
        recipe.steps = JSON.parse(recipe.steps);

        return {
            ...recipe,
            timeAgo: recipe.created_at,
            steps: recipe.steps,
            user,
            ingredients,
            tags,
            isLikedByCurrentUser: Boolean(isLikedByCurrentUser),
            totalLikes: totalLikes.count,
            commentsCount: commentsCount.count,
        };
    }));
}

async function getRecipeById(recipeId) {
    return await knex('recipes').where('id', recipeId).first();
}

async function deleteRecipe(recipeId) {
    await knex.transaction(async transaction => {
        await transaction('recipe_ingredients').where('recipe_id', recipeId).del();
        await transaction('recipe_tags').where('recipe_id', recipeId).del();
        await transaction('favorite_recipes').where('recipe_id', recipeId).del();
        await transaction('comments').where('recipe_id', recipeId).del();
        await transaction('post_likes_notifications').where('recipe_id', recipeId).del();
        await transaction('recipe_images').where('recipe_id', recipeId).del();
        await transaction('recipes').where('id', recipeId).del();
    });
}

module.exports = router;