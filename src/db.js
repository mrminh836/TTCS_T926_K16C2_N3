const knex = require('knex');
const config = require('./knexfile');

/**
 * Database instance (Knex)
 * Được export và sử dụng xuyên suốt toàn bộ ứng dụng.
 */
const db = knex(config);

module.exports = db;
