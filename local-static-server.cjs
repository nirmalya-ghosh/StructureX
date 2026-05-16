const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "dist");
const apiRoot = path.join(process.cwd(), "api");
const port = Number(process.env.PORT || 8000);

for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) {
    continue;
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) {
      continue;
    }
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const rewrites = {
  "/": "index.html",
  "/login": "auth.html",
  "/auth-callback": "auth-callback.html",
  "/dashboard": "index.html",
  "/forgot-password": "forgot-password.html",
  "/terms": "terms.html",
  "/privacy": "privacy.html",
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    if (url.pathname.startsWith("/api/")) {
      const routeName = url.pathname.slice("/api/".length).replace(/\/$/, "");
      const handlerPath = path.normalize(path.join(apiRoot, `${routeName}.js`));
      if (!handlerPath.startsWith(apiRoot) || !fs.existsSync(handlerPath)) {
        res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ detail: "API route not found" }));
        return;
      }

      try {
        delete require.cache[require.resolve(handlerPath)];
        await require(handlerPath)(req, res);
      } catch (error) {
        console.error(`API route failed: ${url.pathname}`, error);
        if (!res.headersSent) {
          res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        }
        res.end(JSON.stringify({ detail: "Internal API error" }));
      }
      return;
    }

    let relativePath = rewrites[url.pathname] || decodeURIComponent(url.pathname.replace(/^\//, ""));

    if (!relativePath || relativePath.endsWith("/")) {
      relativePath += "index.html";
    }

    const filePath = path.normalize(path.join(root, relativePath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "content-type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`StructureX local site: http://127.0.0.1:${port}`);
  });
