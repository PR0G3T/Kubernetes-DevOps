"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

let requestCount = 0;
const port = Number(process.env.PORT || 8080);
const counterFilePath = process.env.COUNTER_FILE_PATH || "/shared/pingpong_count.txt";

function ensureDirectoryExists(filePath) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/pingpong") {
    const current = requestCount;
    requestCount += 1;
    try {
      ensureDirectoryExists(counterFilePath);
      fs.writeFileSync(counterFilePath, String(requestCount), { encoding: "utf-8" });
    } catch (err) {
      // ignore write errors, still respond
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


