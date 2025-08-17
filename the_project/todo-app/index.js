"use strict";

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 3000);
const welcomeMessage = process.env.WELCOME_MESSAGE || "Welcome to the Todo App";
const cacheDir = process.env.CACHE_DIR || "/cache";
const cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS || 600);
const imageUrl = process.env.IMAGE_SOURCE_URL || "https://picsum.photos/1200";

const cachedImagePath = path.join(cacheDir, "image.jpg");
const metaPath = path.join(cacheDir, "meta.json");

let isFetching = false;

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readMeta() {
  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    return JSON.parse(raw);
  } catch (_e) {
    return { lastFetchedEpochMs: 0, servedOldOnceAfterExpiry: false };
  }
}

function writeMeta(meta) {
  try {
    ensureDirExists(cacheDir);
    fs.writeFileSync(metaPath, JSON.stringify(meta), "utf-8");
  } catch (_e) {
    // ignore
  }
}

function shouldRefresh(meta, nowMs) {
  const ageSec = (nowMs - (meta.lastFetchedEpochMs || 0)) / 1000;
  if (ageSec <= cacheTtlSeconds) return false; // still fresh
  // older than TTL
  if (!meta.servedOldOnceAfterExpiry) {
    // serve old once more
    meta.servedOldOnceAfterExpiry = true;
    writeMeta(meta);
    return false;
  }
  return true; // fetch new
}

function followRedirect(url, cb) {
  https.get(url, (res) => {
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      followRedirect(res.headers.location, cb);
      return;
    }
    cb(null, res);
  }).on("error", (err) => cb(err));
}

function fetchImageIfNeeded(cb) {
  ensureDirExists(cacheDir);
  const meta = readMeta();
  const now = Date.now();
  if (!shouldRefresh(meta, now)) {
    cb(null, false);
    return;
  }
  if (isFetching) {
    // poll until fetch completes
    const start = Date.now();
    const wait = () => {
      if (!isFetching) return cb(null, false);
      if (Date.now() - start > 10000) return cb(new Error("Timeout waiting for fetch"));
      setTimeout(wait, 200);
    };
    wait();
    return;
  }
  isFetching = true;
  followRedirect(imageUrl, (err, res) => {
    if (err || !res || (res.statusCode && res.statusCode >= 400)) {
      isFetching = false;
      cb(err || new Error(`Bad status ${res && res.statusCode}`));
      return;
    }
    const tmpPath = cachedImagePath + ".tmp";
    const out = fs.createWriteStream(tmpPath);
    res.pipe(out);
    out.on("finish", () => {
      try {
        fs.renameSync(tmpPath, cachedImagePath);
        const newMeta = { lastFetchedEpochMs: Date.now(), servedOldOnceAfterExpiry: false };
        writeMeta(newMeta);
        isFetching = false;
        cb(null, true);
      } catch (e) {
        isFetching = false;
        cb(e);
      }
    });
    out.on("error", (e) => {
      isFetching = false;
      cb(e);
    });
  });
}

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
      .card { max-width: 820px; margin: 0 auto; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
      h1 { margin: 0 0 0.5rem; font-size: 2.25rem; }
      p { margin: 0.25rem 0; color: #374151; }
      code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 6px; }
      img { max-width: 100%; height: auto; display: block; margin: 1rem 0; border-radius: 8px; }
      .todo-row { display: flex; gap: 0.5rem; align-items: center; margin: 0.5rem 0 0.25rem; }
      input[type="text"] { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; }
      button { padding: 0.4rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; cursor: pointer; }
      small { color: #6b7280; }
      ul { padding-left: 1rem; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>The project App</h1>
      <p>Server is running on port <code>${port}</code>.</p>
      <img src="/image" alt="Random" />
      <div class="todo-row">
        <input id="todoInput" type="text" placeholder="New todo" maxlength="140" />
        <button id="todoCreate" disabled>Create todo</button>
      </div>
      <small id="charInfo">0 / 140</small>
      <ul id="todoList"></ul>
      <p>DevOps with Kubernetes 2025</p>
    </div>
    <script>
      (function () {
        const input = document.getElementById('todoInput');
        const btn = document.getElementById('todoCreate');
        const info = document.getElementById('charInfo');
        const list = document.getElementById('todoList');
        function update() {
          const len = input.value.length;
          info.textContent = len + ' / 140';
          btn.disabled = len === 0 || len > 140;
        }
        input.addEventListener('input', update);
        update();
        async function fetchTodos() {
          try {
            const res = await fetch('/api/todos');
            const data = await res.json();
            list.innerHTML = data.map(t => `<li>${t.text}</li>`).join('');
          } catch (e) {
            list.innerHTML = '<li>Failed to load todos</li>';
          }
        }
        async function createTodo() {
          const text = input.value.trim();
          if (!text || text.length > 140) return;
          try {
            await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
            input.value = '';
            update();
            fetchTodos();
          } catch (e) {}
        }
        btn.addEventListener('click', createTodo);
        fetchTodos();
      })();
    </script>
  </body>
</html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (req.method === "GET" && req.url === "/image") {
    fetchImageIfNeeded((_err) => {
      // Even on error, try to serve whatever we have
      try {
        const stream = fs.createReadStream(cachedImagePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        stream.pipe(res);
        stream.on("error", () => {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("image not available\n");
        });
      } catch (_e) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("image not available\n");
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ok\n");
    return;
  }

  if (req.method === "GET" && req.url === "/readiness") {
    // Frontend is ready when it can serve or fetch image (cheap check: respond 200)
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ready\n");
    return;
  }

  if (req.method === "POST" && req.url === "/exit") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("bye\n", () => process.exit(0));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found\n");
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Server started in port ${port}\n`);
});

