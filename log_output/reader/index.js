"use strict";

const http = require("http");
const fs = require("fs");
const http = require("http");

const port = Number(process.env.PORT || 8080);
const logFilePath = process.env.LOG_FILE_PATH || "/data/log.txt";
const pingPongServiceHost = process.env.PING_PONG_HOST || "ping-pong";
const pingPongServicePort = Number(process.env.PING_PONG_PORT || 8080);

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/status")) {
    try {
      const content = fs.readFileSync(logFilePath, { encoding: "utf-8" });
      const lines = content.trimEnd();
      // Fetch count from ping-pong service
      const options = { hostname: pingPongServiceHost, port: pingPongServicePort, path: "/count", method: "GET" };
      const req2 = http.request(options, (res2) => {
        let data = "";
        res2.setEncoding("utf-8");
        res2.on("data", (chunk) => (data += chunk));
        res2.on("end", () => {
          const count = Number(String(data || "").trim()) || 0;
          const body = `${lines}${lines ? "\n" : ""}Ping / Pongs: ${count}\n`;
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(body);
        });
      });
      req2.on("error", () => {
        const body = `${lines}${lines ? "\n" : ""}Ping / Pongs: 0\n`;
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(body);
      });
      req2.end();
    } catch (err) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      // If we cannot read the log file, still try to fetch count
      const options = { hostname: pingPongServiceHost, port: pingPongServicePort, path: "/count", method: "GET" };
      const req2 = http.request(options, (res2) => {
        let data = "";
        res2.setEncoding("utf-8");
        res2.on("data", (chunk) => (data += chunk));
        res2.on("end", () => {
          const count = Number(String(data || "").trim()) || 0;
          res.end(`Ping / Pongs: ${count}\n`);
        });
      });
      req2.on("error", () => {
        res.end("Ping / Pongs: 0\n");
      });
      req2.end();
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Reader server listening on port ${port}\n`);
});


