"use strict";

const http = require("http");

const port = Number(process.env.PORT || 3000);

const requestListener = (_req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("todo-app\n");
};

const server = http.createServer(requestListener);

server.listen(port, "0.0.0.0", () => {
  // Required startup message for the exercise
  process.stdout.write(`Server started in port ${port}\n`);
});

