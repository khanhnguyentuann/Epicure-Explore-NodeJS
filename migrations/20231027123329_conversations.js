exports.up = function (knex) {
    return knex.schema.createTable('conversations', function (table) {
        table.increments('id').primary();
        table.integer('user1_id').unsigned().notNullable();
        table.integer('user2_id').unsigned().notNullable();
        table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

        table.foreign('user1_id').references('id').inTable('users');
        table.foreign('user2_id').references('id').inTable('users');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('conversations');
};
