"use strict";

const http = require("http");
const fs = require("fs");

const port = Number(process.env.PORT || 8080);
const logFilePath = process.env.LOG_FILE_PATH || "/data/log.txt";
const messageFromEnv = process.env.MESSAGE || "";
const infoFilePath = "/config/information.txt";
const pingPongServiceHost = process.env.PING_PONG_HOST || "ping-pong";
const pingPongServicePort = Number(process.env.PING_PONG_PORT || 8080);
const greeterServiceHost = process.env.GREETER_HOST || "greeter-svc";
const greeterServicePort = Number(process.env.GREETER_PORT || 8080);

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/status")) {
    try {
      const content = fs.readFileSync(logFilePath, { encoding: "utf-8" });
      const lines = content.trimEnd();
      let infoText = "";
      try {
        infoText = fs.readFileSync(infoFilePath, { encoding: "utf-8" }).trim();
      } catch (e) {
        infoText = "";
      }
      // Fetch count from ping-pong service
      const options = { hostname: pingPongServiceHost, port: pingPongServicePort, path: "/count", method: "GET" };
      const req2 = http.request(options, (res2) => {
        let data = "";
        res2.setEncoding("utf-8");
        res2.on("data", (chunk) => (data += chunk));
        res2.on("end", () => {
          const count = Number(String(data || "").trim()) || 0;
          // Fetch greeting from greeter service
          const gopts = { hostname: greeterServiceHost, port: greeterServicePort, path: "/hello", method: "GET" };
          const req3 = http.request(gopts, (res3) => {
            let g = "";
            res3.setEncoding("utf-8");
            res3.on("data", (c) => (g += c));
            res3.on("end", () => {
              const greeting = String(g || "").trim();
              const header = `file content: ${infoText}\nenv variable: MESSAGE=${messageFromEnv}`;
              const body = `${header}\n${lines}${lines ? "\n" : ""}Ping / Pongs: ${count}\n` +
                `greetings: ${greeting}\n`;
              res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
              res.end(body);
            });
          });
          req3.on("error", () => {
            const header = `file content: ${infoText}\nenv variable: MESSAGE=${messageFromEnv}`;
            const body = `${header}\n${lines}${lines ? "\n" : ""}Ping / Pongs: ${count}\n` +
              `greetings: (unavailable)\n`;
            res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
            res.end(body);
          });
          req3.end();
        });
      });
      req2.on("error", () => {
        const header = `file content: ${infoText}\nenv variable: MESSAGE=${messageFromEnv}`;
        const body = `${header}\n${lines}${lines ? "\n" : ""}Ping / Pongs: 0\n`;
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(body);
      });
      req2.end();
    } catch (err) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      // If we cannot read the log file, still try to fetch count
      let infoText = "";
      try {
        infoText = fs.readFileSync(infoFilePath, { encoding: "utf-8" }).trim();
      } catch (e) {
        infoText = "";
      }
      const options = { hostname: pingPongServiceHost, port: pingPongServicePort, path: "/count", method: "GET" };
      const req2 = http.request(options, (res2) => {
        let data = "";
        res2.setEncoding("utf-8");
        res2.on("data", (chunk) => (data += chunk));
        res2.on("end", () => {
          const count = Number(String(data || "").trim()) || 0;
          const header = `file content: ${infoText}\nenv variable: MESSAGE=${messageFromEnv}`;
          res.end(`${header}\nPing / Pongs: ${count}\n`);
        });
      });
      req2.on("error", () => {
        const header = `file content: ${infoText}\nenv variable: MESSAGE=${messageFromEnv}`;
        res.end(`${header}\nPing / Pongs: 0\n`);
      });
      req2.end();
    }
    return;
  }

  // Readiness: ready when ping-pong /count is reachable
  if (req.method === "GET" && req.url === "/readiness") {
    const options = { hostname: pingPongServiceHost, port: pingPongServicePort, path: "/count", method: "GET" };
    const req2 = http.request(options, (res2) => {
      if (res2.statusCode && res2.statusCode >= 200 && res2.statusCode < 300) {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("ready\n");
      } else {
        res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("not ready\n");
      }
    });
    req2.on("error", () => {
      res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("not ready\n");
    });
    req2.end();
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Reader server listening on port ${port}\n`);
});


