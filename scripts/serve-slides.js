// Serves the deck at http://localhost:3402 (or just open slides/index.html).
//   npm run slides
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
const ROOT = new URL('../slides/', import.meta.url);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf' };
const PORT = Number(process.env.PORT) || 3402;
createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  if (path.includes('..')) { res.writeHead(400).end(); return; }
  try { const body = await readFile(new URL(path, ROOT)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(PORT, () => console.log(`Slides: http://localhost:${PORT}   (→/← to move, N notes, F fullscreen)`));
