'use strict';

const config = require('../config');

// Single seam between "real backing store" and "dev/demo backing store" -
// both expose the exact same function names, so nothing above this file
// (services/authService.js, routes/api.js) needs to know or care which one
// is active. Selected once at startup from config.db.mode, itself derived
// from whether real MYSQL_* env vars are set (see config.js) - never from a
// separate feature flag that could drift out of sync with what credentials
// actually exist.
module.exports = config.db.mode === 'mysql' ? require('./mysqlStore') : require('./memoryStore');
