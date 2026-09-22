const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3100;
const KEYS_DIR = path.join(__dirname, '..', 'contract', 'managed', 'kredit', 'keys');
const ZKIR_DIR = path.join(__dirname, '..', 'contract', 'managed', 'kredit', 'zkir');

const MIME_TYPES = {
  '.prover': 'application/octet-stream',
  '.verifier': 'application/octet-stream',
  '.zkir': 'application/octet-stream',
  '.bzkir': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const filePath = decodeURIComponent(url.pathname);
  console.log(`[ZK] ${req.method} ${filePath}`);

  let fullPath;
  if (filePath.startsWith('/keys/')) {
    fullPath = path.join(KEYS_DIR, path.basename(filePath));
  } else if (filePath.startsWith('/zkir/')) {
    fullPath = path.join(ZKIR_DIR, path.basename(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  if (!fs.existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(fullPath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(fullPath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`ZK artifacts server running on http://localhost:${PORT}`);
  console.log(`  Keys:   ${KEYS_DIR}`);
  console.log(`  ZKIR:   ${ZKIR_DIR}`);
});
