import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'companies.db');
const db = new Database(DB_PATH);

const columns = db.prepare(`PRAGMA table_info(companies)`).all() as Array<{
  name: string;
}>;
const names = columns.map(c => c.name);

if (!names.includes('research_bu_session_id')) {
  db.exec(`ALTER TABLE companies ADD COLUMN research_bu_session_id INTEGER`);
  console.log('Added: research_bu_session_id column');
} else {
  console.log('research_bu_session_id column already exists. Skipping.');
}

if (!names.includes('outreach_bu_session_id')) {
  db.exec(`ALTER TABLE companies ADD COLUMN outreach_bu_session_id INTEGER`);
  console.log('Added: outreach_bu_session_id column');
} else {
  console.log('outreach_bu_session_id column already exists. Skipping.');
}

db.close();
console.log('Migration complete.');
