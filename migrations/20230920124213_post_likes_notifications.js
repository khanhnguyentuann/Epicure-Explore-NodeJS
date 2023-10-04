exports.up = function (knex) {
    return knex.schema.createTable('post_likes_notifications', function (table) {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users'); // id người nhận thông báo (chủ nhân bài viết)
        table.integer('recipe_id').unsigned().notNullable().references('id').inTable('recipes'); // id công thức được like
        table.integer('sender_id').unsigned().notNullable().references('id').inTable('users'); // id người like công thức
        table.boolean('is_read').defaultTo(false); // trạng thái đã đọc thông báo hay chưa
        table.timestamp('created_at').defaultTo(knex.fn.now()); // Thời gian tạo thông báo
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('post_likes_notifications');
};
