exports.up = function (knex) {
    return knex.schema.createTable('messages', function (table) {
        table.increments('id').primary();
        table.integer('conversation_id').unsigned().notNullable();
        table.integer('sender_id').unsigned().notNullable();
        table.text('content').notNullable();
        table.dateTime('sent_at').notNullable().defaultTo(knex.fn.now());

        table.foreign('conversation_id').references('id').inTable('conversations');
        table.foreign('sender_id').references('id').inTable('users');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('messages');
};
