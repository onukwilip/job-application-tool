import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'companies.db'));

const result = db.prepare(`
  UPDATE companies
  SET applied_status = NULL
  WHERE applied_status = 'skipped'
`).run();

console.log(`Reset ${result.changes} compan${result.changes === 1 ? 'y' : 'ies'} from applied_status='skipped' to NULL.`);
db.close();
