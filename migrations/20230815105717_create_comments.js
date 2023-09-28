exports.up = function (knex) {
  return knex.schema.createTable('comments', function (table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.integer('recipe_id').unsigned().references('id').inTable('recipes');
    table.text('content').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('comments');
};