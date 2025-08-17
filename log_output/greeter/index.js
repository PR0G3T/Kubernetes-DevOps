"use strict";

const http = require("http");

const port = Number(process.env.PORT || 8080);
const greeting = process.env.GREETING || "Hello from version 1";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/hello")) {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(greeting + "\n");
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`greeter listening on ${port}\n`);
});


