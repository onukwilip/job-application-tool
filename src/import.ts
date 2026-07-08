import 'dotenv/config';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { insertCompany, insertDiscoveredJob, type DiscoveredJob } from './db.js';

const IMPORT_SOURCE = process.env.IMPORT_SOURCE;

if (IMPORT_SOURCE !== 'xlsx' && IMPORT_SOURCE !== 'json') {
  throw new Error(
    `IMPORT_SOURCE must be set to "xlsx" or "json" (got: ${IMPORT_SOURCE ?? 'unset'})`
  );
}

function importFromXlsx(): void {
  const FILE_PATH = path.join(process.cwd(), 'data', 'companies.xlsx');

  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // sheet_to_json reads the first row as column headers automatically
  const records = XLSX.utils.sheet_to_json<{
    company_name: string;
    urls: string;
    job_ad?: string;
  }>(sheet);

  let imported = 0;

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
    imported++;
  }

  console.log(`\nDone. ${imported} companies imported.`);
}

function importFromJson(): void {
  const FILE_PATH = path.join(process.cwd(), 'data', 'companies.json');

  const records = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8')) as Partial<DiscoveredJob>[];

  let inserted = 0;
  let skipped = 0;

  for (const row of records) {
    if (!row.company_name || !row.job_url) {
      console.warn('Skipping row with missing company_name or job_url:', row);
      skipped++;
      continue;
    }

    const job: DiscoveredJob = {
      company_name: row.company_name,
      job_url: row.job_url,
      url: row.url ?? '',
      job_ad: row.job_ad ?? '',
    };

    const wasInserted = insertDiscoveredJob(job);
    if (wasInserted) {
      console.log(`Imported: ${job.company_name}`);
      inserted++;
    } else {
      console.log(`Skipping duplicate (job_url already exists): ${job.company_name}`);
      skipped++;
    }
  }

  console.log(`\nDone. ${inserted} companies imported, ${skipped} skipped.`);
}

if (IMPORT_SOURCE === 'xlsx') {
  importFromXlsx();
} else {
  importFromJson();
}
