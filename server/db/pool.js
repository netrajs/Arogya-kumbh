'use strict';

const mysql = require('mysql2/promise');
const config = require('../config');

// Only ever created (and only ever imported) when config.db.mode === 'mysql'
// - i.e. once real MYSQL_HOST/USER/DATABASE env vars are actually set. See
// db/repository.js for the mode switch.
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
