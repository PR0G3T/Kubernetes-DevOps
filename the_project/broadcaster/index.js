"use strict";

const { connect, StringCodec } = require("nats");
const https = require("https");
const http = require("http");

const natsUrl = process.env.NATS_URL || "";
const targetUrl = process.env.BROADCAST_URL || "";

const sc = StringCodec();

function postJson(urlString, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlString);
      const isHttps = u.protocol === "https:";
      const client = isHttps ? https : http;
      const req = client.request(
        {
          hostname: u.hostname,
          port: u.port || (isHttps ? 443 : 80),
          path: u.pathname + (u.search || ""),
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve(res.statusCode || 0));
        }
      );
      req.on("error", reject);
      req.write(JSON.stringify(body));
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function main() {
  if (!natsUrl || !targetUrl) {
    process.stderr.write("Missing NATS_URL or BROADCAST_URL\n");
    process.exit(1);
  }
  const conn = await connect({ servers: natsUrl });
  const sub = conn.subscribe("todos.events", { queue: "broadcasters" });
  for await (const m of sub) {
    try {
      const payload = JSON.parse(sc.decode(m.data));
      const message = {
        user: "bot",
        message: `Todo ${payload.eventType}: ${payload.todo?.id} ${payload.todo?.text} done=${payload.todo?.done}`,
      };
      await postJson(targetUrl, message);
    } catch (_e) {
      // swallow, next message
    }
  }
}

main().catch((e) => {
  process.stderr.write(String(e) + "\n");
  process.exit(1);
});


