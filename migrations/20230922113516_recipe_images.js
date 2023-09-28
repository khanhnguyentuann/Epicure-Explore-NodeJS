exports.up = function (knex) {
    return knex.schema.createTable('recipe_images', function (table) {
        table.increments('id').primary();
        table.integer('recipe_id').unsigned().references('id').inTable('recipes');
        table.string('image_url').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('recipe_images');
};
