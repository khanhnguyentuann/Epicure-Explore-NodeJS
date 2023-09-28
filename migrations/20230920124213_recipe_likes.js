exports.up = function (knex) {
    return knex.schema.createTable('recipe_likes', function (table) {
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
        table.integer('recipe_id').unsigned().notNullable().references('id').inTable('recipes');
        table.primary(['user_id', 'recipe_id']);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('recipe_likes');
};
