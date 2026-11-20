const fs = require('fs');
const path = require('path');

const dir = __dirname;
const serverCode = fs.readFileSync(path.join(dir, 'server.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(dir, 'public', 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(dir, 'public', 'style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(dir, 'public', 'app.js'), 'utf8');

// Build replacement for static serving block
const staticServingCode = `
// ═══════════════════════════════════════════════════════════════
// BULLETPROOF STATIC FILE SERVING (DISK SEARCH + EMBEDDED FALLBACK)
// ═══════════════════════════════════════════════════════════════
const EMBEDDED_INDEX_HTML = ${JSON.stringify(indexHtml)};
const EMBEDDED_STYLE_CSS = ${JSON.stringify(styleCss)};
const EMBEDDED_APP_JS = ${JSON.stringify(appJs)};

function findFile(filename) {
  const candidates = [
    path.join(__dirname, 'public', filename),
    path.join(__dirname, filename),
    path.join(__dirname, 'krillion-chinese', 'public', filename),
    path.join(__dirname, 'krillion-chinese', filename),
    path.join(process.cwd(), 'public', filename),
    path.join(process.cwd(), filename),
    path.join(process.cwd(), 'krillion-chinese', 'public', filename),
    path.join(process.cwd(), 'krillion-chinese', filename),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (e) {}
  }
  return null;
}

function serveResource(res, filename, contentType, fallbackContent) {
  const filePath = findFile(filename);
  if (filePath) {
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
      return;
    } catch (e) {}
  }
  // Fallback to embedded content
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(fallbackContent);
}
`;

// Replace the old static file serving section
const splitMarker = '// ── STATIC FILE SERVING ──';
const parts = serverCode.split(splitMarker);
if (parts.length < 2) {
  console.error('Split marker not found');
  process.exit(1);
}

const before = parts[0];
const newHandling = `
  // ── STATIC FILE SERVING ──
  if (pathname === '/' || pathname === '/index.html') {
    return serveResource(res, 'index.html', 'text/html; charset=utf-8', EMBEDDED_INDEX_HTML);
  }
  if (pathname === '/style.css') {
    return serveResource(res, 'style.css', 'text/css; charset=utf-8', EMBEDDED_STYLE_CSS);
  }
  if (pathname === '/app.js') {
    return serveResource(res, 'app.js', 'application/javascript; charset=utf-8', EMBEDDED_APP_JS);
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🌊 亿中选一 (Krillion Multiplayer) 服务启动成功！');
  console.log('📍 端口: ' + PORT);
  console.log('====================================================');
});
`;

const finalCode = before + staticServingCode + newHandling;
fs.writeFileSync(path.join(dir, 'server.js'), finalCode, 'utf8');
console.log('Done! Updated server.js with embedded assets.');
