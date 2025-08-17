"use strict";

const http = require("http");
const { Client } = require("pg");

let requestCount = 0;
const port = Number(process.env.PORT || 8080);
const databaseUrl = process.env.DATABASE_URL || "";

let pgClient = null;
async function initDb() {
  if (!databaseUrl) return;
  pgClient = new Client({ connectionString: databaseUrl });
  await pgClient.connect();
  await pgClient.query(
    "CREATE TABLE IF NOT EXISTS pingpong_counter (id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), count INTEGER NOT NULL DEFAULT 0);"
  );
  await pgClient.query(
    "INSERT INTO pingpong_counter (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;"
  );
  const r = await pgClient.query("SELECT count FROM pingpong_counter WHERE id = 1;");
  requestCount = Number(r.rows?.[0]?.count || 0);
}

initDb().catch((e) => {
  // Keep running without DB; counter will be in-memory
  pgClient = null;
});

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/pingpong") {
    // Back-compat if called directly without route rewrite
    const current = requestCount;
    requestCount += 1;
    if (pgClient) {
      pgClient
        .query("UPDATE pingpong_counter SET count = $1 WHERE id = 1;", [requestCount])
        .catch(() => {});
    }
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`pong ${current}\n`);
    return;
  }

  if (req.method === "GET" && req.url === "/count") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(requestCount));
    return;
  }

  // Root path provides the ping-pong behavior to support route rewrite
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const current = requestCount;
    requestCount += 1;
    if (pgClient) {
      pgClient
        .query("UPDATE pingpong_counter SET count = $1 WHERE id = 1;", [requestCount])
        .catch(() => {});
    }
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`pong ${current}\n`);
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<!doctype html><html><body><p>Ping-Pong app. Try <a href=\"/pingpong\">/pingpong</a>.</p></body></html>");
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Ping-Pong server listening on port ${port}\n`);
});


