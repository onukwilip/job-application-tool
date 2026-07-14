import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'companies.db'));

const columns = (db.prepare(`PRAGMA table_info(companies)`)
  .all() as Array<{ name: string }>)
  .map(c => c.name);

if (!columns.includes('applied_status')) {
  db.exec(`ALTER TABLE companies ADD COLUMN applied_status TEXT`);
  console.log('Added: applied_status (null | done | failed | skipped)');
}
if (!columns.includes('applied_at')) {
  db.exec(`ALTER TABLE companies ADD COLUMN applied_at TEXT`);
  console.log('Added: applied_at');
}
if (!columns.includes('applied_error')) {
  db.exec(`ALTER TABLE companies ADD COLUMN applied_error TEXT`);
  console.log('Added: applied_error');
}

db.close();
console.log('Migration complete.');
