const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "src"), { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(dist, "index.html"));
fs.copyFileSync(path.join(root, "src", "main.js"), path.join(dist, "src", "main.js"));
fs.copyFileSync(path.join(root, "src", "style.css"), path.join(dist, "src", "style.css"));
console.log(`已生成静态发布目录：${dist}`);
