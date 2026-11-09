'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const contactHandler = require('./api/contact');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function responseAdapter(res) {
  return {
    setHeader: (name, value) => res.setHeader(name, value),
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      res.end(JSON.stringify(payload));
      return this;
    },
    end: (body = '') => res.end(body)
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/contact') {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 12_000) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: 'The message is too large.' }));
        return;
      }
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    req.body = body;
    req.headers['content-length'] = String(size);
    return contactHandler(req, responseAdapter(res));
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(url.pathname);
  } catch (_error) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  const filePath = path.resolve(ROOT, `.${requestedPath}`);
  const relativePath = path.relative(ROOT, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  if (relativePath.split(path.sep).some((segment) => segment.startsWith('.'))) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    res.end('Not found');
    return;
  }
  let resolvedFile = requestedPath === '/' ? path.join(ROOT, 'index.html') : filePath;
  if (fs.existsSync(resolvedFile) && fs.statSync(resolvedFile).isDirectory()) resolvedFile = path.join(resolvedFile, 'index.html');

  if (!fs.existsSync(resolvedFile) || !fs.statSync(resolvedFile).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    res.end('Not found');
    return;
  }

  const contentType = MIME_TYPES[path.extname(resolvedFile)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(resolvedFile).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Takumi AutoLabs site ready on http://0.0.0.0:${PORT}`);
});
