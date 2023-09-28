exports.up = function (knex) {
    return knex.schema.createTable('favorite_recipes', function (table) {
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.integer('recipe_id').unsigned().references('id').inTable('recipes');
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.primary(['user_id', 'recipe_id']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('favorite_recipes');
};
