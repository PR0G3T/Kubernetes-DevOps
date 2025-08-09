"use strict";

const http = require("http");

const DEFAULT_PORT = 3000;
const portFromEnv = Number(process.env.PORT);
const port = Number.isFinite(portFromEnv) && portFromEnv > 0 ? portFromEnv : DEFAULT_PORT;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("todo app says hello\n");
});

server.listen(port, () => {
  console.log(`Server started in port ${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);


