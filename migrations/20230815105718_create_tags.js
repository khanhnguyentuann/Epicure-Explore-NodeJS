exports.up = function(knex) {
    return knex.schema.createTable('tags', function(table) {
      table.increments('id').primary();
      table.string('tag_name').notNullable().unique();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('tags');
  };