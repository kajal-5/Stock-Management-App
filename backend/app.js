import express from 'express';
import cookieSession from 'cookie-session';
import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Database: Turso/libSQL in production (TURSO_DATABASE_URL), local SQLite file otherwise.
if (isProd && process.env.VERCEL && !process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL is not set.');
if (isProd && process.env.VERCEL && !process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set.');
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(dir, 'stock-management-app.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let ready;
function init() {
  ready ??= (async () => {
    await db.batch([
      'CREATE TABLE IF NOT EXISTS organizations(id INTEGER PRIMARY KEY, name TEXT NOT NULL, default_threshold INTEGER NOT NULL DEFAULT 5)',
      'CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, organization_id INTEGER NOT NULL REFERENCES organizations(id))',
      'CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, organization_id INTEGER NOT NULL REFERENCES organizations(id), name TEXT NOT NULL, sku TEXT NOT NULL, description TEXT, quantity INTEGER NOT NULL DEFAULT 0, cost REAL, price REAL, threshold INTEGER, UNIQUE(organization_id,sku))',
    ], 'write');
    // Upgrade databases created by older versions of the app.
    for (const [table, column, def] of [['organizations', 'default_threshold', 'INTEGER NOT NULL DEFAULT 5'], ['products', 'description', 'TEXT'], ['products', 'cost', 'REAL']]) {
      try { await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`); } catch { /* column already exists */ }
    }
  })().catch(e => { ready = undefined; throw e; });
  return ready;
}

const all = async (sql, args = []) => (await db.execute({ sql, args })).rows.map(r => ({ ...r }));
const get = async (sql, args = []) => (await all(sql, args))[0];
const run = (sql, args = []) => db.execute({ sql, args });
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'stock-management-app-demo-change-this-secret',
  httpOnly: true, sameSite: 'lax', secure: !!process.env.VERCEL, maxAge: 86400000,
}));
app.use(wrap(async (req, res, next) => { await init(); next(); }));

const auth = (req, res, next) => (req.session.userId ? next() : res.status(401).json({ error: 'Please log in.' }));
const orgOf = async req => (await get('SELECT organization_id FROM users WHERE id=?', [req.session.userId]))?.organization_id;

app.get('/api/health', wrap(async (req, res) => { await get('SELECT 1 AS ok'); res.json({ ok: true }); }));

app.post('/api/signup', wrap(async (req, res) => {
  const { name, organization, email, password } = req.body || {};
  if (!name?.trim() || !organization?.trim() || !email?.trim() || !password || password.length < 6)
    return res.status(400).json({ error: 'Fill all fields. Password must be at least 6 characters.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const org = await run('INSERT INTO organizations(name) VALUES (?)', [organization.trim()]);
    const user = await run('INSERT INTO users(name,email,password,organization_id) VALUES (?,?,?,?)', [name.trim(), email.toLowerCase().trim(), hash, org.lastInsertRowid]);
    req.session.userId = Number(user.lastInsertRowid);
    res.json({ user: { name: name.trim(), organization: organization.trim() } });
  } catch (e) {
    res.status(400).json({ error: String(e.message).includes('UNIQUE') ? 'That email is already registered.' : 'Could not create account.' });
  }
}));

app.post('/api/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await get('SELECT users.*,organizations.name AS organization FROM users JOIN organizations ON organizations.id=users.organization_id WHERE email=?', [(email || '').toLowerCase().trim()]);
  if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  req.session.userId = user.id;
  res.json({ user: { name: user.name, organization: user.organization } });
}));

app.get('/api/me', wrap(async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  const u = await get('SELECT users.name,organizations.name AS organization FROM users JOIN organizations ON organizations.id=users.organization_id WHERE users.id=?', [req.session.userId]);
  u ? res.json({ user: u }) : res.status(401).json({ error: 'Not logged in' });
}));

app.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });

app.get('/api/products', auth, wrap(async (req, res) => {
  const orgId = await orgOf(req);
  const org = await get('SELECT default_threshold FROM organizations WHERE id=?', [orgId]);
  res.json(await all('SELECT id,name,sku,description,quantity,cost,price,COALESCE(threshold,?) AS threshold FROM products WHERE organization_id=? ORDER BY id DESC', [org.default_threshold, orgId]));
}));

async function saveProduct(req, res, id) {
  const orgId = await orgOf(req);
  const { name, sku, description, quantity, cost, price, threshold } = req.body || {};
  if (!name?.trim() || !sku?.trim() || !Number.isInteger(Number(quantity)) || Number(quantity) < 0)
    return res.status(400).json({ error: 'Name, SKU and a non-negative whole quantity are required.' });
  const num = v => (v === '' || v == null ? null : Number(v));
  try {
    if (id) await run('UPDATE products SET name=?,sku=?,description=?,quantity=?,cost=?,price=?,threshold=? WHERE id=? AND organization_id=?', [name.trim(), sku.trim(), description || '', Number(quantity), num(cost), num(price), num(threshold), id, orgId]);
    else await run('INSERT INTO products(organization_id,name,sku,description,quantity,cost,price,threshold) VALUES (?,?,?,?,?,?,?,?)', [orgId, name.trim(), sku.trim(), description || '', Number(quantity), num(cost), num(price), num(threshold)]);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message).includes('UNIQUE') ? 'SKU already exists in this organization.' : 'Could not save product.' });
  }
}
app.post('/api/products', auth, wrap((req, res) => saveProduct(req, res)));
app.put('/api/products/:id', auth, wrap((req, res) => saveProduct(req, res, req.params.id)));
app.delete('/api/products/:id', auth, wrap(async (req, res) => {
  await run('DELETE FROM products WHERE id=? AND organization_id=?', [req.params.id, await orgOf(req)]);
  res.json({ ok: true });
}));

app.get('/api/settings', auth, wrap(async (req, res) => {
  res.json(await get('SELECT default_threshold FROM organizations WHERE id=?', [await orgOf(req)]));
}));
app.put('/api/settings', auth, wrap(async (req, res) => {
  const value = Number(req.body?.default_threshold);
  if (!Number.isInteger(value) || value < 0) return res.status(400).json({ error: 'Enter a whole number zero or greater.' });
  await run('UPDATE organizations SET default_threshold=? WHERE id=?', [value, await orgOf(req)]);
  res.json({ ok: true });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error.' }); });

export default app;
