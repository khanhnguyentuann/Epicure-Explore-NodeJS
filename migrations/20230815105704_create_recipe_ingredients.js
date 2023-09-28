exports.up = function(knex) {
    return knex.schema.createTable('recipe_ingredients', function(table) {
      table.integer('recipe_id').unsigned().references('id').inTable('recipes');
      table.integer('ingredient_id').unsigned().references('id').inTable('ingredients');
      table.string('amount').notNullable();
  
      table.primary(['recipe_id', 'ingredient_id']);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('recipe_ingredients');
  };