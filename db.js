const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'iglesia.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'voluntario',
  team_id INTEGER,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT,
  song_key TEXT,
  tempo TEXT,
  link TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_date TEXT NOT NULL,
  service_time TEXT,
  title TEXT NOT NULL,
  service_type TEXT,
  notes TEXT,
  status TEXT DEFAULT 'planificado',
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS service_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  song_id INTEGER,
  duration_minutes INTEGER,
  leader_user_id INTEGER,
  notes TEXT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id),
  FOREIGN KEY (leader_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS service_volunteers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  team_id INTEGER,
  role_name TEXT,
  status TEXT DEFAULT 'pendiente',
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);
`);

// --- Password hashing (scrypt, sin dependencias externas) ---
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const attempted = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(attempted), Buffer.from(hash));
}

// --- Seed inicial: equipos y usuario admin ---
function seed() {
  const teamCount = db.prepare('SELECT COUNT(*) as c FROM teams').get().c;
  if (teamCount === 0) {
    const insertTeam = db.prepare('INSERT INTO teams (name) VALUES (?)');
    ['Alabanza', 'Sonido', 'Multimedia y Cámaras', 'Ujieres', 'Niños', 'Recepción'].forEach(t => insertTeam.run(t));
  }

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    const { hash, salt } = hashPassword('admin123');
    db.prepare(
      'INSERT INTO users (name, username, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)'
    ).run('Administrador', 'admin', hash, salt, 'admin');
    console.log('Usuario inicial creado -> usuario: admin | contraseña: admin123 (cámbiala luego de entrar)');
  }
}

seed();

module.exports = { db, hashPassword, verifyPassword };
