import http from "http";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("todo-app\n");
});

server.listen(port, () => {
  console.log(`Server started in port ${port}`);
});


