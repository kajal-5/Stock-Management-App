// Local dev / self-hosted entry point. On Vercel, api/index.js is used instead.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from './app.js';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(frontendDir, 'dist')));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDir, 'dist', 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root: frontendDir, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Stock management app running at http://localhost:${port}`));
