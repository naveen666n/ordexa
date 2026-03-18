'use strict';
// Used by Sequelize CLI for migrations/seeders in production.
// Reads DB credentials from environment variables.
require('dotenv').config();

module.exports = {
  development: {
    username: 'root',
    password: 'root1234',
    database: 'product_catalog_dev',
    host: '127.0.0.1',
    port: 3307,
    dialect: 'mysql',
    logging: false,
  },
  test: {
    username: 'root',
    password: 'root1234',
    database: 'product_catalog_test',
    host: '127.0.0.1',
    port: 3307,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
  },
};
