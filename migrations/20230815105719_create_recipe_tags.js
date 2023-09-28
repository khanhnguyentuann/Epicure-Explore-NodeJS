exports.up = function(knex) {
  return knex.schema.createTable('recipe_tags', function(table) {
    table.integer('recipe_id').unsigned().references('id').inTable('recipes');
    table.integer('tag_id').unsigned().references('id').inTable('tags');

    table.primary(['recipe_id', 'tag_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('recipe_tags');
};