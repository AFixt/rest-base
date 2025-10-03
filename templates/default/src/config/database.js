/**
 * Database Configuration
 *
 * Sequelize configuration for different environments
 * @author {{author}}
 */

require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '{{projectName}}_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // eslint-disable-line no-console
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // MySQL 9.0 compatibility - explicit charset and collation
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci'
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
      timestamps: true
    }
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || '{{projectName}}_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // MySQL 9.0 compatibility - explicit charset and collation
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci'
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
      timestamps: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // MySQL 9.0 compatibility - explicit charset and collation
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
      // MySQL 9.0 compatibility - caching_sha2_password authentication
      authPlugins: {
        caching_sha2_password: () => () => Buffer.from([])
      },
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false
            }
          : false
    },
    // Define charset at top level for table creation
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
      timestamps: true
    }
  }
};

module.exports = config;
