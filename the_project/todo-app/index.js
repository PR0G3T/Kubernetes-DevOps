"use strict";

const http = require("http");

const port = Number(process.env.PORT || 3000);
const welcomeMessage = process.env.WELCOME_MESSAGE || "Welcome to the Todo App";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Todo App</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; padding: 2rem; }
      .card { max-width: 640px; margin: 0 auto; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
      h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
      p { margin: 0.25rem 0; color: #374151; }
      code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 6px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${welcomeMessage}</h1>
      <p>Server is running on port <code>${port}</code>.</p>
      <p>This is a minimal HTML response for exercise 1.5.</p>
    </div>
  </body>
</html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Server started in port ${port}\n`);
});

