exports.up = function (knex) {
    return knex.schema.createTable('recipes', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users');
        table.string('name').notNullable();
        table.string('preparationTime').notNullable();
        table.text('steps').notNullable();
        table.enu('difficulty', ['dễ', 'trung bình', 'khó']).defaultTo('dễ');
        table.integer('servingFor').notNullable();;
        table.string('cookingTime').notNullable();;
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('recipes');
};