exports.up = function(knex) {
    return knex.schema.createTable('users', function(table) {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.string('avatar');
        table.date('join_date').notNullable().defaultTo(knex.fn.now());
        table.string('role').notNullable().defaultTo('user');
        table.string('otp').nullable();
        table.dateTime('otpExpires').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('users');
};

