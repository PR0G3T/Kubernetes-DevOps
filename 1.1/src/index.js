'use strict';

const crypto = require('crypto');

function generateRandomString() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

const instanceId = generateRandomString();

function logMessage() {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`${timestamp}: ${instanceId}`);
}

logMessage();
setInterval(logMessage, 5000);

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));


