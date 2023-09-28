exports.up = function (knex) {
    return knex.schema.createTable('friendships', function (table) {
        table.integer('user_id1').unsigned().references('id').inTable('users');
        table.integer('user_id2').unsigned().references('id').inTable('users');
        table.enu('status', ['pending', 'accepted', 'declined']).defaultTo('pending');
        table.timestamps(true, true);

        table.primary(['user_id1', 'user_id2']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('friendships');
};
