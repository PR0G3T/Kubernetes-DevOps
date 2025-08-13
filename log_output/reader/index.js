"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 8080);
const logFilePath = process.env.LOG_FILE_PATH || "/data/log.txt";
const counterFilePath = process.env.COUNTER_FILE_PATH || "/shared/pingpong_count.txt";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/status")) {
    try {
      const content = fs.readFileSync(logFilePath, { encoding: "utf-8" });
      let count = 0;
      try {
        const raw = fs.readFileSync(counterFilePath, { encoding: "utf-8" }).trim();
        count = Number(raw) || 0;
      } catch (err) {
        count = 0;
      }
      const lines = content.trimEnd();
      const body = `${lines}${lines ? "\n" : ""}Ping / Pongs: ${count}\n`;
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(body);
    } catch (err) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      let count = 0;
      try {
        const raw = fs.readFileSync(counterFilePath, { encoding: "utf-8" }).trim();
        count = Number(raw) || 0;
      } catch (e) {
        count = 0;
      }
      res.end(`Ping / Pongs: ${count}\n`);
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Reader server listening on port ${port}\n`);
});


