// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const APP_PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme123'; // set a secure token in production

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
const db = new Database(path.join(__dirname, 'db.sqlite'));
db.pragma('journal_mode = WAL');

// Create orders table if missing
db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    email TEXT,
    product TEXT,
    details TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Helper: require admin token
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Create order (public)
app.post('/api/orders', (req, res) => {
  const { name, phone, email, product, details } = req.body || {};
  if (!name || !phone || !product) return res.status(400).json({ error: 'Missing fields' });

  const stmt = db.prepare('INSERT INTO orders (name, phone, email, product, details) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(name, phone, email || '', product, details || '');
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
  res.json({ order });
});

// Get all orders (admin)
app.get('/api/orders', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json({ orders: rows });
});

// Get single order (admin)
app.get('/api/orders/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json({ order: row });
});

// Update order status/details (admin)
app.put('/api/orders/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status, details } = req.body || {};
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Order not found' });

  const upd = db.prepare('UPDATE orders SET status = COALESCE(?, status), details = COALESCE(?, details) WHERE id = ?');
  upd.run(status, details, id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ order: updated });
});

// Delete order (admin)
app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  res.json({ success: true });
});

// Fallback to index.html for SPA-style pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(APP_PORT, () => console.log(`Ordering app running on port ${APP_PORT}`));
