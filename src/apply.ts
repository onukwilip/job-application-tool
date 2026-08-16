import 'dotenv/config';
import pLimit from 'p-limit';
import Anthropic from '@anthropic-ai/sdk';
import { bu } from './bu-adapter.js';
import CapSolver from 'node-capsolver';
import {
  getCompaniesReadyToApply,
  markApplied,
  markApplyFailed,
  markApplySkipped,
  getSummary,
  getApplyStats,
  type Company,
} from './db.js';
import { APPLY_PROMPT } from './prompts.js';

// ─── Clients ─────────────────────────────────────────────────────────────────

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Config ───────────────────────────────────────────────────────────────────

const BU_MODEL   = process.env.APPLY_BU_MODEL ?? 'bu-mini';
const APPLY_LIMIT = process.env.APPLY_LIMIT
  ? parseInt(process.env.APPLY_LIMIT, 10)
  : undefined;

// Keep concurrency low — form filling needs careful pacing
// Running 2 sessions at once is the safe ceiling
const CONCURRENCY = 2;

const APPLICANT = {
  firstName:  process.env.APPLICANT_FIRST_NAME  ?? 'Prince',
  lastName:   process.env.APPLICANT_LAST_NAME   ?? 'Onukwili',
  email:      process.env.APPLICANT_EMAIL        ?? '',
  phone:      process.env.APPLICANT_PHONE        ?? '',
  city:       process.env.APPLICANT_CITY         ?? 'Lagos',
  country:    process.env.APPLICANT_COUNTRY      ?? 'Nigeria',
  linkedin:   process.env.APPLICANT_LINKEDIN     ?? '',
  website:    process.env.APPLICANT_PORTFOLIO      ?? process.env.APPLICANT_LINKEDIN ?? '',
  gender:     process.env.APPLICANT_GENDER       ?? 'Male',
  yearsExperience: process.env.APPLICANT_YEARS_EXPERIENCE ?? '7',
  salary:     process.env.APPLICANT_SALARY       ?? '120000',
  salaryMin:  process.env.APPLICANT_SALARY_MIN   ?? '100000',
  salaryMax:  process.env.APPLICANT_SALARY_MAX   ?? '150000',
  resumeUrl:  process.env.RESUME_URL             ?? '',
};

// ─── Cover letter extraction ──────────────────────────────────────────────────

/**
 * Extracts the cover letter body from a cold email.
 * Splits at the literal "Hi NAME..." greeting and returns everything after it.
 * Falls back to the full email if the greeting is not found.
 *
 * Note: Unicode bold characters (𝗯𝗼𝗹𝗱) will appear as-is in the form field
 * since stripUnicodeBold is not implemented in this version.
 */
function extractCoverLetter(coldEmail: string): string {
  const parts = coldEmail.split('Hi NAME...');
  return parts.length > 1 ? parts[1].trim() : coldEmail.trim();
}

// ─── Lever (CapSolver + direct POST, no browser) ──────────────────────────────

const LEVER_APPLY_URL_RE = /^https:\/\/jobs\.lever\.co\/([^/]+)\/([^/?#]+)/;

function isLeverUrl(jobUrl: string): boolean {
  return LEVER_APPLY_URL_RE.test(jobUrl);
}

function parseLeverUrl(jobUrl: string): { company: string; postingId: string } | null {
  const match = jobUrl.match(LEVER_APPLY_URL_RE);
  if (!match) return null;
  return { company: match[1], postingId: match[2] };
}

async function getLeverSitekey(applyPageUrl: string): Promise<string> {
  const res = await fetch(applyPageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const html = await res.text();

  // hCaptcha sitekey is embedded as data-sitekey attribute
  const match = html.match(/data-sitekey="([^"]+)"/);
  if (!match) throw new Error('hCaptcha sitekey not found on Lever apply page');
  return match[1];
}

// async function solveLeverCaptcha(
//   sitekey: string,
//   applyPageUrl: string,
//   capsolverKey: string
// ): Promise<string> {
//   const solver = new CapSolver(capsolverKey, { verbose: false });

//   const result = await solver.solve({
//     type: 'HCaptchaTaskProxyless',
//     websiteURL: applyPageUrl,
//     websiteKey: sitekey,
//   });

//   if (result.errorId === 1) {
//     throw new Error(`CapSolver error: ${result.errorCode ?? ''} ${result.errorDescription ?? ''}`.trim());
//   }

//   const token = result.solution?.gRecaptchaResponse as string | undefined;
//   if (!token) throw new Error('CapSolver returned no hCaptcha token');
//   return token;
// }

async function solveLeverCaptcha(
  sitekey: string,
  pageUrl: string
): Promise<string> {
  const apiKey = process.env.CAPSOLVER_API_KEY!;

  // Try Enterprise type first (Lever likely uses hCaptcha Enterprise)
  // Fall back to standard if Enterprise returns an error
  const taskTypes = ['HCaptchaEnterpriseTaskProxyless', 'HCaptchaTaskProxyless'];

  for (const taskType of taskTypes) {
    console.log(`    Trying CapSolver task type: ${taskType}`);

    const createRes = await fetch('https://api.capsolver.com/createTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: apiKey,
        task: {
          type: taskType,
          websiteURL: pageUrl,
          websiteKey: sitekey,
        },
      }),
    });

    const createData = await createRes.json() as {
      errorId: number;
      errorCode?: string;
      errorDescription?: string;
      taskId?: string;
    };

    // If this task type is unsupported, try the next one
    if (
      createData.errorId !== 0 &&
      createData.errorCode === 'ERROR_INVALID_TASK_DATA'
    ) {
      console.warn(`    ${taskType} not supported, trying next...`);
      continue;
    }

    if (createData.errorId !== 0 || !createData.taskId) {
      throw new Error(
        `CapSolver createTask failed: ${createData.errorDescription}`
      );
    }

    const taskId = createData.taskId;
    console.log(`    Task created: ${taskId}`);

    // Poll for result (max 90 seconds, 3s intervals)
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(r => setTimeout(r, 3000));

      const resultRes = await fetch('https://api.capsolver.com/getTaskResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientKey: apiKey, taskId }),
      });

      const result = await resultRes.json() as {
        errorId: number;
        status: 'processing' | 'ready' | 'failed';
        solution?: { gRecaptchaResponse?: string };
        errorDescription?: string;
      };

      if (result.status === 'ready') {
        const token = result.solution?.gRecaptchaResponse;
        if (!token) throw new Error('CapSolver returned ready status but no token');
        console.log(`    Token received via ${taskType}`);
        return token;
      }

      if (result.status === 'failed' || result.errorId !== 0) {
        throw new Error(
          `CapSolver solving failed: ${result.errorDescription ?? 'unknown error'}`
        );
      }

      console.log(`    Still solving... (attempt ${attempt + 1}/30)`);
    }

    throw new Error('CapSolver timeout after 90 seconds');
  }

  throw new Error('All CapSolver task types failed for this hCaptcha');
}

async function applyToLever(company: Company, jobUrl: string, coverLetter: string): Promise<void> {
  const capsolverKey = process.env.CAPSOLVER_API_KEY;
  if (!capsolverKey) {
    const msg = 'CAPSOLVER_API_KEY not set — cannot solve Lever hCaptcha';
    markApplyFailed(company.id, msg);
    console.error(`  ✗ ${msg}`);
    return;
  }

  const parsed = parseLeverUrl(jobUrl);
  if (!parsed) {
    markApplyFailed(company.id, 'Could not parse Lever URL');
    console.error(`  ✗ Could not parse Lever URL: ${jobUrl}`);
    return;
  }

  const applyPageUrl = `https://jobs.lever.co/${parsed.company}/${parsed.postingId}/apply`;

  try {
    console.log(`    Fetching Lever apply page for sitekey...`);
    const sitekey = await getLeverSitekey(applyPageUrl);
    console.log(`    Sitekey found: ${sitekey.slice(0, 8)}...`);

    console.log(`    Solving hCaptcha via CapSolver...`);
    // const captchaToken = await solveLeverCaptcha(sitekey, applyPageUrl, capsolverKey);
    const captchaToken = await solveLeverCaptcha(sitekey, applyPageUrl);
    console.log(`    CAPTCHA solved.`);

    const resumeRes  = await fetch(APPLICANT.resumeUrl);
    const resumeBlob = Buffer.from(await resumeRes.arrayBuffer());

    const formData = new FormData();
    formData.append('name',               `${APPLICANT.firstName} ${APPLICANT.lastName}`);
    formData.append('email',              APPLICANT.email);
    formData.append('phone',              APPLICANT.phone);
    formData.append('org',                '');
    formData.append('urls[LinkedIn]',     APPLICANT.linkedin);
    formData.append('urls[Portfolio]',    APPLICANT.website);
    formData.append('comments',           coverLetter);
    formData.append('source',             'LinkedIn');
    formData.append('h-captcha-response', captchaToken);
    formData.append('resume', new Blob([resumeBlob], { type: 'application/pdf' }), 'resume.pdf');

    const submitRes = await fetch(applyPageUrl, {
      method: 'POST',
      headers: {
        'Origin':  'https://jobs.lever.co',
        'Referer': applyPageUrl,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: formData,
    });

    if (submitRes.ok || submitRes.status === 302) {
      markApplied(company.id);
      console.log(`  ✓ Applied successfully via Lever direct POST`);
      return;
    }

    const responseText = await submitRes.text().catch(() => '');
    const msg = `Lever returned ${submitRes.status}: ${responseText.slice(0, 200)}`;
    markApplyFailed(company.id, msg);
    console.error(`  ✗ ${msg}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markApplyFailed(company.id, message);
    console.error(`  ✗ Lever apply error: ${message}`);
  }
}

// ─── Result parsing (same rescue chain pattern as discover.ts) ────────────────

interface ApplyResult {
  success: boolean;
  message: string;
  fields_filled?: string[];
  issues?: string[];
  submitted_url?: string;
}

async function parseResult(
  raw: string,
  companyName: string
): Promise<ApplyResult | null> {
  const cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.success === 'boolean') return parsed as ApplyResult;
  } catch { /* fall through */ }

  // Try extracting a JSON object from prose
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.success === 'boolean') return parsed as ApplyResult;
    } catch { /* fall through */ }
  }

  // Haiku rescue
  console.warn(`  [${companyName}] Haiku rescue for apply result...`);
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract the application result from this text and return a JSON object with:
success (boolean), message (string), issues (array of strings).
Return ONLY the raw JSON, no markdown.

Text:
${raw.slice(0, 2000)}`,
      }],
    });
    const content = msg.content[0];
    if (content.type !== 'text') return null;
    const rescueCleaned = content.text
      .replace(/^```json\s*/im, '')
      .replace(/\s*```$/m, '')
      .trim();
    return JSON.parse(rescueCleaned) as ApplyResult;
  } catch {
    return null;
  }
}

// ─── Per-company application ──────────────────────────────────────────────────

async function applyToCompany(company: Company): Promise<void> {
  console.log(`\n[APPLY] ${company.name} → ${company.job_url}`);

  if (!APPLICANT.resumeUrl) {
    const msg = 'RESUME_URL not set in .env';
    markApplyFailed(company.id, msg);
    console.error(`  ✗ ${msg}`);
    return;
  }

  if (!company.cold_email) {
    markApplySkipped(company.id, 'No cold email generated');
    console.warn(`  Skipped — no cold email in DB`);
    return;
  }

  const jobUrl      = company.job_url!;
  const coverLetter = extractCoverLetter(company.cold_email);

  if (isLeverUrl(jobUrl)) {
    // await applyToLever(company, jobUrl, coverLetter);
    console.log("Skipping lever jobs temporarily...")
    return;
  }

  const prompt = APPLY_PROMPT(APPLICANT, jobUrl, coverLetter);

  try {
    const { output } = await bu(prompt, { model: BU_MODEL });

    const raw = typeof output === 'string'
      ? output
      : JSON.stringify(output ?? {});

    const parsed = await parseResult(raw, company.name);

    if (!parsed) {
      markApplyFailed(company.id, 'Could not parse BU output');
      console.error(`  ✗ Could not parse result from BU`);
      console.error(`    Raw (first 300):`, raw.slice(0, 300));
      return;
    }

    if (parsed.success) {
      markApplied(company.id);
      console.log(`  ✓ Applied successfully — ${parsed.message}`);
      if (parsed.fields_filled?.length) {
        console.log(`    Fields filled: ${parsed.fields_filled.join(', ')}`);
      }
    } else {
      // Determine if this is a permanent skip or a retriable failure
      const isSkip = parsed.message?.toLowerCase().includes('account creation')
        || parsed.message?.toLowerCase().includes('no form found')
        || parsed.message?.toLowerCase().includes('already applied')
        || parsed.message?.toLowerCase().includes('captcha');

      if (isSkip) {
        markApplySkipped(company.id, parsed.message);
        console.warn(`  ↷ Skipped — ${parsed.message}`);
      } else {
        markApplyFailed(company.id, parsed.message);
        console.error(`  ✗ Failed — ${parsed.message}`);
      }

      if (parsed.issues?.length) {
        console.warn(`    Issues: ${parsed.issues.join(' | ')}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markApplyFailed(company.id, message);
    console.error(`  ✗ BU session error: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting job application run...');
  console.log(`BU model:   ${BU_MODEL}`);
  console.log(`Applicant:  ${APPLICANT.firstName} ${APPLICANT.lastName} <${APPLICANT.email}>`);
  console.log(`Resume URL: ${APPLICANT.resumeUrl || 'NOT SET — will fail'}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  const allCompanies = getCompaniesReadyToApply();
  const companies    = APPLY_LIMIT
    ? allCompanies.slice(0, APPLY_LIMIT)
    : allCompanies;

  console.log(`Ready to apply: ${allCompanies.length} | This run: ${companies.length}`);

  if (companies.length === 0) {
    console.log('Nothing to apply to. Run "npm run start" first to generate cold emails.');
    return;
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = companies.map(c => limit(() => applyToCompany(c)));
  await Promise.allSettled(tasks);

  console.log('\n=== Application Summary ===');
  console.table(getSummary());

  // Show breakdown of apply statuses specifically
  console.log('\nApplication statuses:');
  console.table(getApplyStats());
}

main().catch(console.error);
