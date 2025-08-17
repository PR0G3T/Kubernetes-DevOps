"use strict";

const http = require("http");
const { Client } = require("pg");

const port = Number(process.env.PORT || 4000);
const maxLen = Number(process.env.TODO_MAXLEN || 140);

const databaseUrl = process.env.DATABASE_URL || "";
let pgClient = null;

function log(level, message, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  process.stdout.write(`[${ts}] ${level.toUpperCase()} ${message}${metaStr}\n`);
}

async function initDb() {
  if (!databaseUrl) return;
  pgClient = new Client({ connectionString: databaseUrl });
  await pgClient.connect();
  await pgClient.query(
    "CREATE TABLE IF NOT EXISTS todos (id SERIAL PRIMARY KEY, text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND $1));",
    [maxLen]
  );
}

initDb().catch(() => {
  pgClient = null;
});

async function checkDbConnection() {
  if (!pgClient) return false;
  try {
    await pgClient.query("SELECT 1;");
    return true;
  } catch (_e) {
    return false;
  }
}

function readRequestBody(req, cb) {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk;
    if (data.length > 1_000_000) {
      req.destroy();
    }
  });
  req.on("end", () => cb(null, data));
  req.on("error", (err) => cb(err));
}

const server = http.createServer((req, res) => {
  log("info", `incoming ${req.method} ${req.url}`);
  if (req.method === "GET" && req.url === "/todos") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    if (!pgClient) {
      res.end(JSON.stringify([]));
      return;
    }
    pgClient
      .query("SELECT id, text FROM todos ORDER BY id ASC;")
      .then((r) => {
        log("info", "fetched todos", { count: r.rowCount });
        res.end(JSON.stringify(r.rows));
      })
      .catch((e) => {
        log("error", "failed to fetch todos", { error: String(e) });
        res.end(JSON.stringify([]));
      });
    return;
  }

  if (req.method === "POST" && req.url === "/todos") {
    readRequestBody(req, (_err, raw) => {
      try {
        const payload = JSON.parse(String(raw || "{}"));
        const text = String(payload.text || "").trim();
        if (text.length === 0 || text.length > maxLen) {
          log("warn", "todo rejected: length constraint", { length: text.length, maxLen });
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "Todo must be 1-140 chars" }));
          return;
        }
        if (!pgClient) {
          log("error", "db unavailable when creating todo");
          res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "DB unavailable" }));
          return;
        }
        pgClient
          .query("INSERT INTO todos (text) VALUES ($1) RETURNING id, text;", [text])
          .then((r) => {
            log("info", "todo created", { id: r.rows[0].id, length: text.length });
            res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify(r.rows[0]));
          })
          .catch((e) => {
            log("error", "insert failed", { error: String(e) });
            res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ error: "Insert failed" }));
          });
      } catch (_e) {
        log("warn", "invalid json in request body");
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ok\n");
    return;
  }

  if (req.method === "GET" && req.url === "/readiness") {
    checkDbConnection().then((ok) => {
      if (ok) {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("ready\n");
      } else {
        res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("not ready\n");
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`todo-backend listening on port ${port}\n`);
});


