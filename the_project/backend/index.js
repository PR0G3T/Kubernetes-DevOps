"use strict";

const http = require("http");

const port = Number(process.env.PORT || 4000);
const maxLen = Number(process.env.TODO_MAXLEN || 140);

/** In-memory todo store */
const todos = [
  { id: 1, text: "Learn JavaScript" },
  { id: 2, text: "Learn React" },
  { id: 3, text: "Build a project" },
];
let nextId = 4;

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
    res.end(JSON.stringify(todos));
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
        const todo = { id: nextId++, text };
        todos.push(todo);
        res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(todo));
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


