import http from "node:http";

const port = Number.parseInt(process.env.PORT || "3000", 10);

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("todo app");
});

server.listen(port, () => {
  console.log(`Server started in port ${port}`);
});
