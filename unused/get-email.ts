import 'dotenv/config';
import pLimit from 'p-limit';
import {
  getCompaniesForOutreach,
  updateOutreach,
  markOutreachFailed,
  getSummary,
  type Company,
  type DecisionMaker,
} from './db.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const CONTACTOUT_API_KEY = process.env.CONTACTOUT_API_KEY!;
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '5', 10);

// Max number of companies to process this run. 0 (or unset) means no limit — process all.
const OUTREACH_LIMIT_RAW = process.env.OUTREACH_LIMIT ?? '0';
const OUTREACH_LIMIT = parseInt(OUTREACH_LIMIT_RAW);

if (Number.isNaN(OUTREACH_LIMIT) || OUTREACH_LIMIT < 0) {
  throw new Error(
    `OUTREACH_LIMIT must be a non-negative integer (got: ${OUTREACH_LIMIT_RAW})`
  );
}

// Titles to search for — technical and founding roles only
const TARGET_TITLES = [
  'CTO',
  'Chief Technology Officer',
  'VP Engineering',
  'VP of Engineering',
  'Vice President of Engineering',
  'Head of Engineering',
  'Head of DevOps',
  'Head of Cloud',
  'Head of Infrastructure',
  'Head of Platform',
  'Platform Engineering Lead',
  'DevOps Lead',
  'Infrastructure Lead',
  'Engineering Manager',
  'Co-Founder',
  'CEO',
];

// Seniority levels to include
const TARGET_SENIORITY = [
  'C Level',
  'Vice President',
  'Director',
  'Owner',
  'Partner',
];

// ─── ContactOut API response types ───────────────────────────────────────────

interface ContactOutProfile {
  full_name: string;
  title: string;
  contact_info?: {
    work_emails?: string[];
    personal_emails?: string[];
    emails?: string[];
  };
}

interface ContactOutResponse {
  status_code: number;
  message?: string;
  profiles?: Record<string, ContactOutProfile> | [];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Extracts the bare domain from a company URL string.
 * Handles comma or space separated multiple URLs by taking the first one.
 * Examples:
 *   "https://www.twingate.com/about https://www.twingate.com/product" → "twingate.com"
 *   "https://broker.com, https://broker.com/docs"                     → "broker.com"
 */
function extractDomain(url: string): string {
  try {
    const firstUrl = url.split(/[\s,]+/)[0].trim();
    const withProtocol = firstUrl.startsWith('http')
      ? firstUrl
      : `https://${firstUrl}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    // Fallback: strip protocol and www manually
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split(',')[0]
      .trim();
  }
}

// ─── Core function ────────────────────────────────────────────────────────────

async function findDecisionMakers(company: Company): Promise<void> {
  const domain = extractDomain(company.urls);
  console.log(`\n[OUTREACH] ${company.name} (domain: ${domain})`);

  if (!domain) {
    console.warn(`  Skipping ${company.name} — could not extract domain from: ${company.urls}`);
    markOutreachFailed(company.id, 'Could not extract domain from urls');
    return;
  }

  try {
    const response = await fetch('https://api.contactout.com/v1/people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': CONTACTOUT_API_KEY,
      },
      body: JSON.stringify({
        domain: [domain],
        job_title: TARGET_TITLES,
        seniority: TARGET_SENIORITY,
        current_titles_only: true,
        reveal_info: true,
        data_types: ['work_email', 'personal_email'],
      }),
    });

    if (!response.ok) {
      console.log(response.body ?? 'No response body');
      throw new Error(`ContactOut API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as ContactOutResponse;

    // No profiles found (API returns [] instead of {} when empty)
    if (!data.profiles || Array.isArray(data.profiles)) {
      console.log(`  No decision makers found for ${company.name}`);
      updateOutreach(company.id, []);
      return;
    }

    // Map ContactOut profile shape → DecisionMaker shape
    const people: DecisionMaker[] = Object.entries(data.profiles).map(
      ([linkedinUrl, profile]) => ({
        name: profile.full_name,
        title: profile.title,
        linkedin: linkedinUrl || null,
        emails: [
          ...(profile.contact_info?.work_emails ?? []),
          ...(profile.contact_info?.personal_emails ?? []),
          ...(profile.contact_info?.emails ?? []),
        ].filter((e, i, arr) => Boolean(e) && arr.indexOf(e) === i), // deduplicate
      })
    );

    console.log(`  Found ${people.length} decision maker(s) for ${company.name}`);
    people.forEach(p =>
      console.log(
        `  - ${p.title}: ${p.name} | ${p.emails.length} email(s) | ${p.linkedin ?? 'no LinkedIn'}`
      )
    );

    updateOutreach(company.id, people);
    console.log(`  [DONE] ${company.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markOutreachFailed(company.id, message);
    console.error(`  [FAILED] ${company.name}: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  if (!CONTACTOUT_API_KEY) {
    console.error('CONTACTOUT_API_KEY is not set in .env');
    process.exit(1);
  }

  console.log('Starting outreach research via ContactOut People Search API...');
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Limit: ${OUTREACH_LIMIT === 0 ? 'none (all eligible companies)' : OUTREACH_LIMIT}`);

  const eligible = getCompaniesForOutreach();
  const companies = OUTREACH_LIMIT === 0 ? eligible : eligible.slice(0, OUTREACH_LIMIT);
  console.log(`Eligible companies: ${eligible.length} | Processing this run: ${companies.length}`);

  if (companies.length === 0) {
    console.log('No companies ready for outreach research.');
    console.log('Run "npm run start" first to generate cold emails.');
    return;
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = companies.map(c => limit(() => findDecisionMakers(c)));
  await Promise.allSettled(tasks);

  console.log('\n=== Outreach Research Summary ===');
  console.table(getSummary());
}

main().catch(console.error);