import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'companies.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sends (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id  INTEGER NOT NULL,
    email       TEXT NOT NULL,
    name        TEXT NOT NULL,
    sent_at     TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(company_id, email),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  )
`);

console.log('sends table ready.');
db.close();
