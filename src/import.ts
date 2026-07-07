import 'dotenv/config';
import XLSX from 'xlsx';
import path from 'path';
import { insertCompany } from './db.js';

const FILE_PATH = path.join(process.cwd(), 'data', 'companies.xlsx');

const workbook = XLSX.readFile(FILE_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// sheet_to_json reads the first row as column headers automatically
const records = XLSX.utils.sheet_to_json<{
  company_name: string;
  urls: string;
  job_ad?: string;
}>(sheet);

for (const row of records) {
  if (!row.company_name || !row.urls) {
    console.warn('Skipping row with missing company_name or urls:', row);
    continue;
  }
  insertCompany(
    row.company_name.trim(),
    row.urls.trim(),
    row.job_ad?.trim() ?? ''
  );
  console.log(`Imported: ${row.company_name}`);
}

console.log(`\nDone. ${records.length} companies imported.`);