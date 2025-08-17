"use strict";

const k8s = require("@kubernetes/client-node");
const http = require("http");
const https = require("https");
const crypto = require("crypto");

const GROUP = "example.com";
const VERSION = "v1";
const PLURAL = "dummysites";

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    try {
      function get(u, redirectCount = 0) {
        const parsed = new URL(u);
        const client = parsed.protocol === "https:" ? https : http;
        const req = client.request(
          {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
            path: parsed.pathname + (parsed.search || ""),
            method: "GET",
            headers: { "User-Agent": "dummysite-controller" },
          },
          (res) => {
            const status = res.statusCode || 0;
            if (status >= 300 && status < 400 && res.headers.location && redirectCount < 10) {
              res.resume();
              get(new URL(res.headers.location, u).toString(), redirectCount + 1);
              return;
            }
            let data = "";
            res.setEncoding("utf-8");
            res.on("data", (c) => (data += c));
            res.on("end", () => resolve(data));
          }
        );
        req.on("error", reject);
        req.end();
      }
      get(url);
    } catch (e) {
      reject(e);
    }
  });
}

function ownerRef(obj) {
  return [
    {
      apiVersion: `${GROUP}/${VERSION}`,
      kind: "DummySite",
      name: obj.metadata.name,
      uid: obj.metadata.uid,
      controller: true,
      blockOwnerDeletion: true,
    },
  ];
}

function sanitizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
}

async function upsertConfigMap(coreApi, ns, name, html, owner) {
  const cmName = `${name}-content`;
  const body = {
    metadata: {
      name: cmName,
      namespace: ns,
      labels: { app: "dummysite", "dummysite/name": name },
      ownerReferences: owner,
    },
    data: { "index.html": html },
  };
  try {
    await coreApi.readNamespacedConfigMap(cmName, ns);
    await coreApi.replaceNamespacedConfigMap(cmName, ns, body);
  } catch (e) {
    if (e?.response?.statusCode === 404) {
      await coreApi.createNamespacedConfigMap(ns, body);
    } else {
      throw e;
    }
  }
}

async function upsertDeployment(appsApi, ns, name, checksum, owner) {
  const depName = name;
  const body = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: depName,
      namespace: ns,
      labels: { app: "dummysite", "dummysite/name": name },
      ownerReferences: owner,
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: "dummysite", "dummysite/name": name } },
      template: {
        metadata: {
          labels: { app: "dummysite", "dummysite/name": name },
          annotations: { "dummysite/checksum": checksum },
        },
        spec: {
          containers: [
            {
              name: "nginx",
              image: "nginx:alpine",
              ports: [{ name: "http", containerPort: 80 }],
              volumeMounts: [{ name: "site", mountPath: "/usr/share/nginx/html", readOnly: true }],
            },
          ],
          volumes: [{ name: "site", configMap: { name: `${name}-content` } }],
        },
      },
    },
  };
  try {
    await appsApi.readNamespacedDeployment(depName, ns);
    await appsApi.replaceNamespacedDeployment(depName, ns, body);
  } catch (e) {
    if (e?.response?.statusCode === 404) {
      await appsApi.createNamespacedDeployment(ns, body);
    } else {
      throw e;
    }
  }
}

async function upsertService(coreApi, ns, name, owner) {
  const svcName = name;
  const body = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: svcName,
      namespace: ns,
      labels: { app: "dummysite", "dummysite/name": name },
      ownerReferences: owner,
    },
    spec: {
      type: "ClusterIP",
      selector: { app: "dummysite", "dummysite/name": name },
      ports: [{ name: "http", port: 80, targetPort: 80 }],
    },
  };
  try {
    await coreApi.readNamespacedService(svcName, ns);
    await coreApi.replaceNamespacedService(svcName, ns, body);
  } catch (e) {
    if (e?.response?.statusCode === 404) {
      await coreApi.createNamespacedService(ns, body);
    } else {
      throw e;
    }
  }
}

async function upsertIngress(netApi, ns, name, owner) {
  const ingName = name;
  const body = {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name: ingName,
      namespace: ns,
      labels: { app: "dummysite", "dummysite/name": name },
      annotations: { "kubernetes.io/ingress.class": "nginx" },
      ownerReferences: owner,
    },
    spec: {
      rules: [
        {
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: { service: { name, port: { number: 80 } } },
              },
            ],
          },
        },
      ],
    },
  };
  try {
    await netApi.readNamespacedIngress(ingName, ns);
    await netApi.replaceNamespacedIngress(ingName, ns, body);
  } catch (e) {
    if (e?.response?.statusCode === 404) {
      await netApi.createNamespacedIngress(ns, body);
    } else {
      // if ingress is not available in cluster, ignore
      if (e?.response?.statusCode === 404 || e?.response?.statusCode === 403) return;
      throw e;
    }
  }
}

async function reconcile(k8sApis, obj) {
  const ns = obj.metadata.namespace || "default";
  const baseName = sanitizeName(obj.metadata.name);
  const name = `dummysite-${baseName}`;
  const url = obj?.spec?.website_url || "";
  if (!url) return;
  const owner = ownerRef(obj);
  let html = "";
  try {
    html = await fetchUrl(url);
  } catch (_e) {
    html = `<html><body><h1>Failed to fetch</h1><p>${url}</p></body></html>`;
  }
  // cap to ~900KB to fit ConfigMap limits
  if (html.length > 900 * 1024) {
    html = html.slice(0, 900 * 1024);
  }
  const checksum = crypto.createHash("sha256").update(html).digest("hex");
  await upsertConfigMap(k8sApis.core, ns, name, html, owner);
  await upsertDeployment(k8sApis.apps, ns, name, checksum, owner);
  await upsertService(k8sApis.core, ns, name, owner);
  try {
    await upsertIngress(k8sApis.net, ns, name, owner);
  } catch (_e) {}
}

async function main() {
  const kc = new k8s.KubeConfig();
  try {
    kc.loadFromCluster();
  } catch (_e) {
    kc.loadFromDefault();
  }
  const core = kc.makeApiClient(k8s.CoreV1Api);
  const apps = kc.makeApiClient(k8s.AppsV1Api);
  const net = kc.makeApiClient(k8s.NetworkingV1Api);
  const co = kc.makeApiClient(k8s.CustomObjectsApi);
  const watch = new k8s.Watch(kc);

  const apis = { core, apps, net, co };

  async function startWatch() {
    await watch.watch(
      `/apis/${GROUP}/${VERSION}/${PLURAL}`,
      {},
      async (phase, obj) => {
        if (phase === "ADDED" || phase === "MODIFIED") {
          await reconcile(apis, obj);
        }
        // deletion is handled by ownerReferences
      },
      (err) => {
        if (err) process.stderr.write(`${String(err)}\n`);
        setTimeout(startWatch, 3000);
      }
    );
  }

  await startWatch();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


