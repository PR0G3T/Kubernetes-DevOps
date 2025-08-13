"use strict";

const http = require("http");
const fs = require("fs");

const port = Number(process.env.PORT || 8080);
const logFilePath = process.env.LOG_FILE_PATH || "/data/log.txt";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/status")) {
    try {
      const content = fs.readFileSync(logFilePath, { encoding: "utf-8" });
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(content || "\n");
    } catch (err) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("\n");
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Reader server listening on port ${port}\n`);
});


