import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'companies.db');
const db = new Database(DB_PATH);

const columns = db.prepare(`PRAGMA table_info(companies)`).all() as Array<{
  name: string;
}>;
const names = columns.map(c => c.name);

if (!names.includes('outreach')) {
  db.exec(`ALTER TABLE companies ADD COLUMN outreach TEXT`);
  console.log('Added: outreach column (stores JSON array of decision makers)');
} else {
  console.log('outreach column already exists. Skipping.');
}

if (!names.includes('outreach_status')) {
  db.exec(`ALTER TABLE companies ADD COLUMN outreach_status TEXT`);
  console.log('Added: outreach_status column');
} else {
  console.log('outreach_status column already exists. Skipping.');
}

db.close();
console.log('Migration complete.');
