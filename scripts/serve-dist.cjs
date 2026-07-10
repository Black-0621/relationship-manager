const http = require("http");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const root = path.resolve(__dirname, "..", "dist");
const preferredPort = Number(process.env.PORT || 4177);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(data);
  });
}

function createServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const requestedPath = path.resolve(root, cleanPath || "index.html");
    const safePath = requestedPath.startsWith(root) ? requestedPath : path.join(root, "index.html");

    fs.stat(safePath, (error, stats) => {
      if (!error && stats.isFile()) {
        sendFile(response, safePath);
        return;
      }
      sendFile(response, path.join(root, "index.html"));
    });
  });
}

function listenOnAvailablePort(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
        listenOnAvailablePort(port + 1).then(resolve, reject);
        return;
      }
      reject(error);
    });
    server.listen(port, "127.0.0.1", () => resolve({ server, port }));
  });
}

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("Missing dist/index.html. Please run npm install and npm run build first.");
  process.exit(1);
}

listenOnAvailablePort(preferredPort)
  .then(({ port }) => {
    const url = `http://127.0.0.1:${port}/`;
    console.log("Relationship Archive is running.");
    console.log(`Open: ${url}`);
    childProcess.exec(`start "" "${url}"`);
  })
  .catch((error) => {
    console.error("Failed to start local server.");
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
