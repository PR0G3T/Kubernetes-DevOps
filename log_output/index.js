"use strict";

const { randomUUID } = require("crypto");
const http = require("http");

const generatedRandomString = randomUUID();
const logIntervalMs = Number(process.env.LOG_INTERVAL_MS || 5000);
const port = Number(process.env.PORT || 8080);

function logRandomStringWithTimestamp() {
  const timestampIso8601 = new Date().toISOString();
  process.stdout.write(`${timestampIso8601}: ${generatedRandomString}\n`);
}

// Log immediately on startup, then every N milliseconds
logRandomStringWithTimestamp();
const intervalHandle = setInterval(logRandomStringWithTimestamp, logIntervalMs);

// Minimal HTTP server for /status endpoint
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/status") {
    const body = JSON.stringify({
      timestamp: new Date().toISOString(),
      value: generatedRandomString,
    });
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(body);
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/>\n<title>Log output</title>\n</head>\n<body>\n<p>Log output app is running. See <a href="/status">/status</a> for current status.</p>\n</body>\n</html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`HTTP server listening on port ${port}\n`);
});

function shutdownGracefully(signalName) {
  process.stdout.write(`Received ${signalName}, shutting down...\n`);
  clearInterval(intervalHandle);
  process.exit(0);
}

process.on("SIGINT", () => shutdownGracefully("SIGINT"));
process.on("SIGTERM", () => shutdownGracefully("SIGTERM"));

