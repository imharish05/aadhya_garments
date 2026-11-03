'use strict';
require('dotenv').config();
const { Sequelize } = require('sequelize');

const isSsl =
  process.env.DB_SSL === 'true' ||
  process.env.DB_PORT === '4000' ||
  (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com'));

const dialectOptions = {
  connectTimeout: 20000,
  ...(isSsl
    ? {
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
        },
      }
    : {}),
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions,
      define: { timestamps: true, underscored: false },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD || null,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        dialectOptions,
        define: { timestamps: true, underscored: false },
      }
    );

module.exports = sequelize;
