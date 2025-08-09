"use strict";

const { randomUUID } = require("crypto");

const instanceId = randomUUID();

function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  // Format: 2020-03-30T12:15:17.705Z: <uuid>
  // Message included for possible future extensions
  console.log(`${timestamp}: ${message}`);
}

// Initial log immediately on startup
logWithTimestamp(instanceId);

// Log every 5 seconds
const intervalId = setInterval(() => {
  logWithTimestamp(instanceId);
}, 5000);

// Graceful shutdown handling (useful in containers)
function shutdown() {
  clearInterval(intervalId);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);


