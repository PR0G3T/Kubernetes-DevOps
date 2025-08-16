"use strict";

const http = require("http");
const { randomUUID } = require("crypto");

const port = Number(process.env.PORT || 4000);

/** In-memory todos */
const todos = [];

function readJsonBody(req, callback) {
  let body = "";
  req.setEncoding("utf-8");
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const json = body ? JSON.parse(body) : {};
      callback(null, json);
    } catch (err) {
      callback(err);
    }
  });
}

const server = http.createServer((req, res) => {
  // Simple routing
  if (req.method === "GET" && req.url === "/todos") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(todos));
    return;
  }

  if (req.method === "POST" && req.url === "/todos") {
    if (!req.headers["content-type"] || !req.headers["content-type"].includes("application/json")) {
      res.writeHead(415, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Content-Type must be application/json" }));
      return;
    }
    readJsonBody(req, (err, data) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const text = String((data && data.text) || "").trim();
      if (text.length === 0 || text.length > 140) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Todo text must be 1-140 characters" }));
        return;
      }
      const todo = { id: randomUUID(), text, createdAt: new Date().toISOString() };
      todos.push(todo);
      res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(todo));
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`todo-backend listening on port ${port}\n`);
});


