// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'recipe_sharing_dev'
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'recipe_sharing_staging'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'mysql',
    connection: {
      host: 'production_host', // Cập nhật host nếu cần
      user: 'root',
      password: '',
      database: 'recipe_sharing_prod'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};





