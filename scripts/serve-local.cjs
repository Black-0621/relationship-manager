const http = require("http");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const root = path.resolve(__dirname, "..");
const preferredPort = Number(process.env.PORT || 4177);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
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
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    });
    response.end(data);
  });
}

function openBrowser(url) {
  const command = process.platform === "win32" ? `start "" "${url}"`
    : process.platform === "darwin" ? `open "${url}"`
    : `xdg-open "${url}"`;
  childProcess.exec(command, () => {});
}

function createServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const requestedPath = path.resolve(root, cleanPath);
    const safePath = requestedPath.startsWith(root) ? requestedPath : path.join(root, "index.html");
    fs.stat(safePath, (error, stats) => {
      if (!error && stats.isFile()) return sendFile(response, safePath);
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

listenOnAvailablePort(preferredPort)
  .then(({ port }) => {
    const url = `http://127.0.0.1:${port}/`;
    console.log("人际关系管理器已启动。");
    console.log(`打开地址：${url}`);
    console.log("请保持这个窗口开启。关闭窗口后，本地页面服务会停止。");
    openBrowser(url);
  })
  .catch((error) => {
    console.error("启动失败：", error && error.message ? error.message : error);
    process.exit(1);
  });
