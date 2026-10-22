// 로컬 확인용 정적 서버 (node survival/dev-server.js → http://localhost:5181)
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };
http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/__save") { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { fs.writeFileSync(path.join(require("os").tmpdir(), "survival_card.png"), Buffer.from(b.split(",")[1], "base64")); res.end("ok"); }); return; }   // 로컬 확인용: 판정서 이미지 저장
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const p = path.join(root, rel);
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(5181);
