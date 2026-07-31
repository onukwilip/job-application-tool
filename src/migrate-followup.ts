import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'companies.db'));

// Add the 4 new columns for follow-up support
const columns = [
  { name: 'message_id', type: 'TEXT', purpose: 'Message-ID of the original email' },
  { name: 'subject', type: 'TEXT', purpose: 'Subject of the original email' },
  { name: 'followup_sent_at', type: 'TEXT', purpose: 'When the follow-up was sent' },
  { name: 'followup_message_id', type: 'TEXT', purpose: 'Message-ID of the follow-up email' },
];

for (const col of columns) {
  try {
    db.exec(`ALTER TABLE sends ADD COLUMN ${col.name} ${col.type}`);
    console.log(`✓ Added column: ${col.name}`);
  } catch (err) {
    const errMsg = (err as Error).message;
    if (errMsg.includes('duplicate column name')) {
      console.log(`✓ Column already exists: ${col.name}`);
    } else {
      throw err;
    }
  }
}

console.log('Follow-up columns ready.');
db.close();
