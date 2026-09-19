'use strict';

const express = require('express');
const cors = require('cors');
const { router } = require('./routes/api');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', router);

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(config.server.port, () => {
      console.log(`Arogya Kumbh Clinic API listening on http://localhost:${config.server.port}`);
      console.log(`Auth mode: ${config.isProduction ? 'production (auth-api)' : 'dev (local mock OTP)'}`);
      console.log(`Data mode: ${config.db.mode}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
