"use strict";

const { randomUUID } = require("crypto");

const generatedRandomString = randomUUID();
const logIntervalMs = Number(process.env.LOG_INTERVAL_MS || 5000);

function logRandomStringWithTimestamp() {
  const timestampIso8601 = new Date().toISOString();
  process.stdout.write(`${timestampIso8601}: ${generatedRandomString}\n`);
}

// Log immediately on startup, then every N milliseconds
logRandomStringWithTimestamp();
const intervalHandle = setInterval(logRandomStringWithTimestamp, logIntervalMs);

function shutdownGracefully(signalName) {
  process.stdout.write(`Received ${signalName}, shutting down...\n`);
  clearInterval(intervalHandle);
  process.exit(0);
}

process.on("SIGINT", () => shutdownGracefully("SIGINT"));
process.on("SIGTERM", () => shutdownGracefully("SIGTERM"));

