"use strict";

const http = require("http");

let requestCount = 0;
const port = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/pingpong") {
    const current = requestCount;
    requestCount += 1;
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`pong ${current}\n`);
    return;
  }

  if (req.method === "GET" && req.url === "/count") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(requestCount));
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


