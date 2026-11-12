# Stock management app

- `frontend/` — React + Vite + Tailwind app (`src/pages`, `src/components`, `src/lib/api.js`).
- `backend/app.js` — Express API (auth, products, settings) using libSQL (SQLite-compatible) and signed-cookie sessions.
- `backend/server.js` — local dev/self-host entry point (serves the API and the frontend on one port).
- `api/index.js` — Vercel serverless entry (re-exports the Express app).
- `vercel.json` — Vercel build + routing config.
- `scripts/smoke-test.sh` — end-to-end test of the frontend and every API route.

## Run locally

1. Install Node.js 20+.
2. `npm install`
3. `npm run dev` and open http://localhost:3001 (uses a local `backend/stock-management-app.db` file).
4. In another terminal: `npm run test:smoke` (or `scripts/smoke-test.sh http://localhost:3001`).

Production-style local run: `npm run build && npm start`.

