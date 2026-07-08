import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'companies.db');
const db = new Database(DB_PATH);

// Check whether job_url already exists
const columns = db.prepare(`PRAGMA table_info(companies)`).all() as Array<{
  name: string;
}>;
const alreadyExists = columns.some(col => col.name === 'job_url');

if (alreadyExists) {
  console.log('job_url column already exists. Nothing to do.');
} else {
  db.exec(`ALTER TABLE companies ADD COLUMN job_url TEXT`);
  console.log('job_url column added successfully.');
}

db.close();