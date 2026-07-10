const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cssPath = path.join(root, "src", "style.css");
const jsPath = path.join(root, "src", "main.js");
const outputPath = path.join(root, "OFFLINE.html");

const css = fs.readFileSync(cssPath, "utf8");
const js = fs.readFileSync(jsPath, "utf8");
const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>人际关系管理器</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
${js}
    </script>
  </body>
</html>
`;
fs.writeFileSync(outputPath, html, "utf8");
console.log(`已生成 ${outputPath}`);
