'use strict';

const express = require('express');

const app = express();
const portEnv = process.env.PORT;
const port = Number(portEnv) > 0 ? Number(portEnv) : 3000;

app.get('/', (_req, res) => {
  res.type('text/plain').send('OK');
});

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started in port ${port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));


