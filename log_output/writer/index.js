"use strict";

const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

const generatedRandomString = randomUUID();
const logIntervalMs = Number(process.env.LOG_INTERVAL_MS || 5000);
const logFilePath = process.env.LOG_FILE_PATH || "/data/log.txt";

function ensureDirectoryExists(filePath) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function appendStatusLine() {
  const timestampIso8601 = new Date().toISOString();
  const line = `${timestampIso8601}: ${generatedRandomString}`;
  try {
    ensureDirectoryExists(logFilePath);
    fs.appendFileSync(logFilePath, line + "\n", { encoding: "utf-8" });
    process.stdout.write(`Wrote: ${line}\n`);
  } catch (err) {
    process.stderr.write(`Failed to write to ${logFilePath}: ${String(err)}\n`);
  }
}

appendStatusLine();
const intervalHandle = setInterval(appendStatusLine, logIntervalMs);

function shutdownGracefully(signalName) {
  process.stdout.write(`Received ${signalName}, shutting down...\n`);
  clearInterval(intervalHandle);
  process.exit(0);
}

process.on("SIGINT", () => shutdownGracefully("SIGINT"));
process.on("SIGTERM", () => shutdownGracefully("SIGTERM"));


