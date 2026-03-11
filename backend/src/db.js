import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || './data';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'audio'), { recursive: true });

const dbPath = path.join(DATA_DIR, 'voicebox.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('senior', 'family')),
    pin TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS voice_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    family_id TEXT NOT NULL REFERENCES families(id),
    audio_path TEXT NOT NULL,
    duration_seconds INTEGER,
    transcript TEXT,
    summary TEXT,
    category TEXT DEFAULT 'general',
    urgency TEXT DEFAULT 'normal' CHECK(urgency IN ('normal', 'important', 'urgent')),
    status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'ready', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_voice_notes_family
    ON voice_notes(family_id, status, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_voice_notes_user
    ON voice_notes(user_id, created_at DESC);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_pin
    ON users(pin);
`);

export default db;
