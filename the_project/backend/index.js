"use strict";

const http = require("http");
const { Client } = require("pg");

const port = Number(process.env.PORT || 4000);
const maxLen = Number(process.env.TODO_MAXLEN || 140);

const databaseUrl = process.env.DATABASE_URL || "";
let pgClient = null;

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
  if (req.method === "GET" && req.url === "/todos") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    if (!pgClient) {
      res.end(JSON.stringify([]));
      return;
    }
    pgClient
      .query("SELECT id, text FROM todos ORDER BY id ASC;")
      .then((r) => res.end(JSON.stringify(r.rows)))
      .catch(() => res.end(JSON.stringify([])));
    return;
  }

  if (req.method === "POST" && req.url === "/todos") {
    readRequestBody(req, (_err, raw) => {
      try {
        const payload = JSON.parse(String(raw || "{}"));
        const text = String(payload.text || "").trim();
        if (text.length === 0 || text.length > maxLen) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "Todo must be 1-140 chars" }));
          return;
        }
        if (!pgClient) {
          res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "DB unavailable" }));
          return;
        }
        pgClient
          .query("INSERT INTO todos (text) VALUES ($1) RETURNING id, text;", [text])
          .then((r) => {
            res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify(r.rows[0]));
          })
          .catch(() => {
            res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ error: "Insert failed" }));
          });
      } catch (_e) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
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


