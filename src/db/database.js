const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cca_bot.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table for tickets
      db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_number INTEGER NOT NULL,
          thread_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          status TEXT DEFAULT 'OPEN',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // Table for RSS deduplication
      db.run(`
        CREATE TABLE IF NOT EXISTS rss_posted (
          guid TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          posted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // Table for member verifications
      db.run(`
        CREATE TABLE IF NOT EXISTS verifications (
          user_id TEXT PRIMARY KEY,
          verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // Table for XP Leveling system
      db.run(`
        CREATE TABLE IF NOT EXISTS levels (
          user_id TEXT PRIMARY KEY,
          xp INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          last_xp INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log("✅ SQLite database initialized successfully with levels table");
          resolve(db);
        }
      });
    });
  });
}

module.exports = { db, initDatabase };
