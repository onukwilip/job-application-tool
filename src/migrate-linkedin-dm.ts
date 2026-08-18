import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'companies.db'));

try {
  db.exec(`ALTER TABLE companies ADD COLUMN linkedin_dm TEXT`);
  console.log('✓ Added column: linkedin_dm');
} catch (err: any) {
  if (err.message?.includes('duplicate column name')) {
    console.log('↷ Already exists: linkedin_dm');
  } else throw err;
}

db.close();