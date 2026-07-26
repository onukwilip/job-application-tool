import XLSX from 'xlsx';
import path from 'path';
import db, { Company, DecisionMaker } from './db.js';

interface ContactRow {
  Company: string;
  Name: string;
  Title: string;
  Email: string;
  LinkedIn: string;
}

function main() {
  const companies = db
    .prepare(
      `SELECT * FROM companies WHERE outreach IS NOT NULL ORDER BY name ASC`
    )
    .all() as Company[];

  const rows: ContactRow[] = [];

  for (const company of companies) {
    let people: DecisionMaker[];
    try {
      people = JSON.parse(company.outreach!) as DecisionMaker[];
    } catch {
      console.warn(`Skipping ${company.name} — could not parse outreach JSON`);
      continue;
    }

    for (const person of people) {
      rows.push({
        Company: company.name,
        Name: person.name,
        Title: person.title ?? '',
        Email: person.emails?.join(', ') ?? '',
        LinkedIn: person.linkedin ?? '',
      });
    }
  }

  if (rows.length === 0) {
    console.log('No contacts found.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 30 }, // Company
    { wch: 25 }, // Name
    { wch: 40 }, // Title
    { wch: 35 }, // Email
    { wch: 45 }, // LinkedIn
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

  const OUTPUT_PATH = path.join(process.cwd(), 'unused', 'contacts.xlsx');
  XLSX.writeFile(workbook, OUTPUT_PATH);

  console.log(`Wrote ${rows.length} contact(s) across ${companies.length} companie(s) to ${OUTPUT_PATH}`);
}

main();
