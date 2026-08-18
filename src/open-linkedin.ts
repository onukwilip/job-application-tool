import 'dotenv/config';
import XLSX from 'xlsx';
import path from 'path';
import { exec } from 'child_process';
import { getOpenedLinkedinUrls, recordLinkedinOpen } from './db.js';

const CONTACTS_FILE = process.env.CONTACTS_FILE;
const OPEN_LIMIT = parseInt(process.env.LINKEDIN_OPEN_LIMIT ?? '20', 10);
const OPEN_DELAY_MS = parseInt(process.env.LINKEDIN_OPEN_DELAY_MS ?? '1500', 10);

interface ContactRow {
  LinkedIn?: string;
}

function openInBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd =
      process.platform === 'darwin' ? `open "${url}"` :
      process.platform === 'win32'  ? `start "" "${url}"` :
      `xdg-open "${url}"`;

    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!CONTACTS_FILE) {
    console.error('CONTACTS_FILE env var is required, e.g. CONTACTS_FILE=unused/contacts-diff.xlsx');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), CONTACTS_FILE);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ContactRow>(sheet);

  const urls = [...new Set(
    rows
      .map((r) => r.LinkedIn?.trim())
      .filter((url): url is string => !!url)
  )];

  const alreadyOpened = getOpenedLinkedinUrls();
  const pending = urls.filter((url) => !alreadyOpened.has(url));

  if (pending.length === 0) {
    console.log(`All ${urls.length} LinkedIn URL(s) in ${CONTACTS_FILE} have already been opened.`);
    return;
  }

  const batch = pending.slice(0, OPEN_LIMIT);

  console.log(`${urls.length} total, ${pending.length} not yet opened, opening ${batch.length} now (cap: ${OPEN_LIMIT}).`);

  for (const url of batch) {
    try {
      await openInBrowser(url);
      recordLinkedinOpen(url);
      console.log(`Opened: ${url}`);
    } catch (err) {
      console.error(`Failed to open ${url}:`, err);
    }
    await sleep(OPEN_DELAY_MS);
  }

  const remaining = pending.length - batch.length;
  console.log(`Done. ${remaining} remaining — run again to continue.`);
}

main();
