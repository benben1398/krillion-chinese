const fs = require('fs');
const path = require('path');
const dir = __dirname;

const bundledHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// Read server.js before the EMBEDDED section
let serverContent = fs.readFileSync(path.join(dir, 'server.js'), 'utf8');
const marker = '// ═══════════════════════════════════════════════════════════════\n// BULLETPROOF STATIC FILE SERVING';
const parts = serverContent.split(marker);
const baseServer = parts[0];

const newServer = baseServer + `// ═══════════════════════════════════════════════════════════════
// BULLETPROOF STATIC FILE SERVING
// ═══════════════════════════════════════════════════════════════
const EMBEDDED_MULTIPLAYER_HTML = ${JSON.stringify(bundledHtml)};

function getMultiplayerHtml() {
  const candidates = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(process.cwd(), 'public', 'index.html'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const str = fs.readFileSync(c, 'utf8');
        if (str.includes('lobbyCode') || str.includes('handleCreateRoom')) {
          return str;
        }
      }
    } catch (e) {}
  }
  return EMBEDDED_MULTIPLAYER_HTML;
}

  // ── ROOM STATE POLLING FALLBACK ──
  if (pathname === '/api/room-state' && req.method === 'GET') {
    const code = (url.searchParams.get('code') || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return sendJson(res, 404, { error: 'Room not found' });
    return sendJson(res, 200, { roomState: getRoomState(room) });
  }

  // ── STATIC FILE SERVING ──
  if (pathname === '/' || pathname === '/index.html') {
    const content = getMultiplayerHtml();
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    return res.end(content);
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🌊 亿中选一 (Krillion Multiplayer) 服务启动成功！');
  console.log('📍 运行端口: ' + PORT);
  console.log('====================================================');
});
`;

// Also fix SSE headers around line 660 in baseServer if needed
const updatedServer = newServer.replace(
  `res.writeHead(200, {\n      'Content-Type': 'text/event-stream',\n      'Cache-Control': 'no-cache',\n      'Connection': 'keep-alive',\n      'Access-Control-Allow-Origin': '*',`,
  `res.writeHead(200, {\n      'Content-Type': 'text/event-stream; charset=utf-8',\n      'Cache-Control': 'no-cache, no-transform',\n      'Connection': 'keep-alive',\n      'X-Accel-Buffering': 'no',\n      'Access-Control-Allow-Origin': '*',`
);

fs.writeFileSync(path.join(dir, 'server.js'), updatedServer, 'utf8');
console.log('Successfully updated server.js with bundled multiplayer HTML and optimized SSE headers! New size: ' + updatedServer.length);
