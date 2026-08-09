import { BrowserUse, type BuModel } from "browser-use-sdk/v3";
import "dotenv/config";
import pLimit from "p-limit";
import Anthropic from "@anthropic-ai/sdk";
import { Company, DecisionMaker, getCompaniesForOutreach, getSummary, markOutreachFailed, updateOutreach } from "./db.js";
import { extractDomain } from "./utils.js";
import { OUTREACH_PROMPT } from "./prompts.js";

// TODO: Declare variables and types
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "5", 10);
const OUTREACH_LIMIT_RAW = process.env.OUTREACH_LIMIT ?? "0";
const OUTREACH_LIMIT = parseInt(OUTREACH_LIMIT_RAW);
const BU_MODEL = (process.env.BROWSER_USE_MODEL ?? "gemini-3-pro") as string;
const HUNTER_KEY = process.env.HUNTER_API_KEY;
const ANYMAIL_KEY = process.env.ANYMAIL_FINDER_API_KEY;

if (Number.isNaN(OUTREACH_LIMIT) || OUTREACH_LIMIT < 0) {
  throw new Error(
    `OUTREACH_LIMIT must be a non-negative integer (got: ${OUTREACH_LIMIT_RAW})`,
  );
}

// Titles to search for — technical and founding roles only
const TARGET_TITLES = [
  "CTO",
  "Chief Technology Officer",
  "VP Engineering",
  "VP of Engineering",
  "Vice President of Engineering",
  "Head of Engineering",
  "Head of DevOps",
  "Head of Cloud",
  "Head of Infrastructure",
  "Head of Platform",
  "Platform Engineering Lead",
  "DevOps Lead",
  "Infrastructure Lead",
  "Engineering Manager",
  "Co-Founder",
  "CEO",
];

// Seniority levels to include
const TARGET_SENIORITY = [
  "C Level",
  "Vice President",
  "Director",
  "Owner",
  "Partner",
];

// TODO: Import BU client
const bu_client = new BrowserUse({
  apiKey: process.env.BROWSER_USE_API_KEY!,
});

// TODO: Import Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// TODO: Normalize output to DecisionMaker shape and pass to Claude as last resort
interface RawPerson {
  name?: string;
  full_name?: string;
  fullName?: string;
  title?: string;
  position?: string;
  role?: string;
  linkedin?: string;
  linkedin_url?: string;
  linkedinUrl?: string;
  // New schema — BU classifies emails as work vs personal
  work_email?: string | string[];
  work_emails?: string | string[];
  personal_email?: string | string[];
  personal_emails?: string | string[];
  // Legacy schema — single mixed email field (kept for backwards compatibility)
  email?: string | string[];
  emails?: string | string[];
  email_address?: string | string[];
  emailAddress?: string | string[];
}

/**
 * Internal shape used while the pipeline still needs to distinguish work vs
 * personal emails (enrichment only fills in a missing WORK email). Merged
 * into the flat DecisionMaker.emails shape only at the very end, via
 * toDecisionMaker().
 */
interface ParsedPerson {
  name: string;
  title: string;
  linkedin: string | null;
  workEmails: string[];
  personalEmails: string[];
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [];
}

function dedupeEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const email of emails) {
    const key = email.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(email.trim());
  }
  return result;
}

/** Merges work + personal emails into the flat array DecisionMaker/DB expects. Work emails first. */
function toDecisionMaker(person: ParsedPerson): DecisionMaker {
  return {
    name: person.name,
    title: person.title,
    linkedin: person.linkedin,
    emails: dedupeEmails([...person.workEmails, ...person.personalEmails]),
  };
}

function normalizePerson(item: Record<string, unknown>): ParsedPerson | null {
  const raw = item as RawPerson;
  const name = String(raw.name ?? raw.full_name ?? raw.fullName ?? "").trim();
  const title = String(raw.title ?? raw.position ?? raw.role ?? "").trim();
  const linkedin = (raw.linkedin ??
    raw.linkedin_url ??
    raw.linkedinUrl ??
    null) as string | null;

  // Must have at least a name to be worth keeping
  if (!name) return null;

  let workEmails = toStringArray(raw.work_emails ?? raw.work_email);
  let personalEmails = toStringArray(raw.personal_emails ?? raw.personal_email);

  // Legacy fallback: old BU/Haiku output had one mixed `email`/`emails` field.
  // Only used when neither new-style field is present, to avoid double-counting.
  if (workEmails.length === 0 && personalEmails.length === 0) {
    workEmails = toStringArray(
      raw.email ?? raw.emails ?? raw.email_address ?? raw.emailAddress,
    );
  }

  return {
    name,
    title,
    linkedin: linkedin || null,
    workEmails,
    personalEmails,
  };
}

function extractArrayFromText(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function unwrapObject(parsed: unknown): unknown[] | null {
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    return null;
  const values = Object.values(parsed as Record<string, unknown>);
  const arr = values.find((v) => Array.isArray(v));
  return arr ? (arr as unknown[]) : null;
}

async function rescueWithClaude(
  raw: string,
  companyName: string,
): Promise<ParsedPerson[]> {
  console.warn(`[${companyName}] Haiku rescue...`);
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Extract all people from this text and return a valid JSON array.
Each object must have exactly these five keys:
  {
    "name": "string — full name, e.g. Jane Smith",
    "title": "string — their exact role",
    "linkedin": "string — full LinkedIn URL, or null if not found",
    "work_emails": "list of strings — email address(es) at their employer's domain, or null if not found",
    "personal_emails": "list of strings — email address(es) NOT at their employer's domain (Gmail, Outlook, personal domain, etc.), or null if not found"
  }
Do not mix up work_emails and personal_emails — an email only belongs in one of the two lists.
Return ONLY the raw JSON array — no markdown, no explanation.
Return [] if no valid people are found.

Text:
${raw}`,
        },
      ],
    });
    const content = msg.content[0];
    if (content.type !== "text") return [];
    const cleaned = content.text
      .replace(/^```json\s*/im, "")
      .replace(/^```\s*/im, "")
      .replace(/\s*```$/m, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p: Record<string, unknown>) => normalizePerson(p))
      .filter((p): p is ParsedPerson => p !== null);
  } catch (err) {
    console.error(`  [${companyName}] Haiku rescue failed:`, err);
    return [];
  }
}

async function parsePeople(
  raw: string,
  companyName: string,
): Promise<ParsedPerson[]> {
  // Stage 1: strip markdown fences
  const cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/\s*```$/m, "")
    .trim();

  let items: unknown[] | null = null;

  // Stage 2: try direct JSON.parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      items = parsed;
    } else {
      items = unwrapObject(parsed);
    }
  } catch {
    // Stage 3: extract embedded array from prose
    items = extractArrayFromText(cleaned);
  }

  // Stage 4: normalize key names
  if (items && items.length > 0) {
    const normalized = items
      .map((item) => normalizePerson(item as Record<string, unknown>))
      .filter((p): p is ParsedPerson => p !== null);
    if (normalized.length > 0) return normalized;
    console.warn(
      `[${companyName}] Parsed ${items.length} items but none survived normalisation`,
    );
  }

  // Stage 5: Claude Haiku rescue
  console.warn(
    `  [${companyName}] Local parse failed. Raw (first 300 chars):`,
    raw.slice(0, 300),
  );
  return rescueWithClaude(raw, companyName);
}

// TODO: Check each user response and if a valid email exists use skip, else, pass company domain + user names to Hunter IO to get user email
async function tryHunter(
  firstName: string,
  lastName: string,
  domain: string,
): Promise<string | null> {
  if (!HUNTER_KEY) return null;
  try {
    const url = new URL("https://api.hunter.io/v2/email-finder");
    url.searchParams.set("domain", domain);
    url.searchParams.set("first_name", firstName);
    url.searchParams.set("last_name", lastName);
    url.searchParams.set("api_key", HUNTER_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { email?: string | null } };
    return data.data?.email ?? null;
  } catch {
    return null;
  }
}

// TODO: Check each user response and if a valid email exists use skip, else, pass user LinkedIn to Anymail to get user email
async function tryAnymailByLinkedIn(
  linkedinUrl: string,
): Promise<string | null> {
  if (!ANYMAIL_KEY) return null;
  try {
    const res = await fetch(
      "https://api.anymailfinder.com/v5.1/find-email/linkedin-url",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ANYMAIL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkedin_url: linkedinUrl }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string | null };
    return data.email ?? null;
  } catch {
    return null;
  }
}

async function tryAnymailByName(
  firstName: string,
  lastName: string,
  domain: string,
): Promise<string | null> {
  if (!ANYMAIL_KEY) return null;
  try {
    const res = await fetch(
      "https://api.anymailfinder.com/v5.1/find-email/person",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ANYMAIL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          domain,
        }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string | null };
    return data.email ?? null;
  } catch {
    return null;
  }
}

// TODO: For each decision maker, if no work email exists, try to find one using Hunter IO or Anymail Finder
// Hunter/Anymail both look up an email by (name + company domain), so anything they find is a WORK email —
// this runs whenever workEmails is empty, even if a personal email was already found by BU.
async function furtherGetEmail(
  person: ParsedPerson,
  domain: string,
): Promise<ParsedPerson> {
  // Already has a work email — no enrichment needed
  if (person.workEmails.length > 0) return person;

  const nameParts = person.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = (nameParts.slice(1).join(" ") || nameParts[0]) ?? "";

  // 1. Hunter Email Finder (name + domain)
  if (firstName && lastName && domain && HUNTER_KEY) {
    const hunterEmail = await tryHunter(firstName, lastName, domain);
    if (hunterEmail) {
      console.log(`    [Hunter] Found work email for ${person.name}`);
      return { ...person, workEmails: [hunterEmail] };
    }
  }

  // 2a. Anymail by LinkedIn URL (if available)
  if (person.linkedin && ANYMAIL_KEY) {
    const anymailEmail = await tryAnymailByLinkedIn(person.linkedin);
    if (anymailEmail) {
      console.log(`    [Anymail/LinkedIn] Found work email for ${person.name}`);
      return { ...person, workEmails: [anymailEmail] };
    }
  }

  // 2b. Anymail by name + domain (fallback when no LinkedIn)
  if (!person.linkedin && firstName && domain && ANYMAIL_KEY) {
    const anymailEmail = await tryAnymailByName(firstName, lastName, domain);
    if (anymailEmail) {
      console.log(`    [Anymail/Name] Found work email for ${person.name}`);
      return { ...person, workEmails: [anymailEmail] };
    }
  }

  // Nothing found — leave work email empty
  return person;
}

// TODO: Get Decision makers for each company
async function getCompanyDecisionMakers(company: Company): Promise<void> {
  const domain = extractDomain(company.urls);
  console.log(`\n[GET-EMAIL] ${company.name} (domain: ${domain})`);

  try {
    // Step 1: Browser Use finds decision makers
    const prompt = OUTREACH_PROMPT(company.name, company.urls);
    const result = await bu_client.run(prompt, { model: BU_MODEL as BuModel });

    const rawOutput = result.output;
    const raw = typeof rawOutput === 'string'
      ? rawOutput
      : JSON.stringify(rawOutput ?? []);

    // Step 2: Parse + normalize
    const people = await parsePeople(raw, company.name);
    console.log(`  BU found ${people.length} person(s) for ${company.name}`);

    // Step 3: Enrich work emails for anyone missing one
    const enrichedParsed = await Promise.all(
      people.map(person => furtherGetEmail(person, domain))
    );

    enrichedParsed.forEach(p => {
      const workStatus     = p.workEmails.length > 0 ? p.workEmails.join(', ') : 'no work email';
      const personalStatus = p.personalEmails.length > 0 ? p.personalEmails.join(', ') : 'no personal email';
      console.log(`  - ${p.title}: ${p.name} | work: ${workStatus} | personal: ${personalStatus} | ${p.linkedin ?? 'no LinkedIn'}`);
    });

    // Step 4: Merge work + personal into the flat DecisionMaker.emails shape and store
    const enriched = enrichedParsed.map(toDecisionMaker);
    updateOutreach(company.id, enriched);
    console.log(`  [DONE] ${company.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markOutreachFailed (company.id, message);
    console.error(`  [FAILED] ${company.name}: ${message}`);
  }
}

async function main() {
  console.log('Starting outreach email discovery...');
  console.log(`BU model: ${BU_MODEL} | Concurrency: ${CONCURRENCY}`);
  console.log('Enrichment providers:', [
    HUNTER_KEY   && 'Hunter.io',
    ANYMAIL_KEY  && 'Anymail Finder',
  ].filter(Boolean).join(' → ') || 'None configured (BU only)');

  const allCompanies = getCompaniesForOutreach();
  const companies    = OUTREACH_LIMIT
    ? allCompanies.slice(0, OUTREACH_LIMIT)
    : allCompanies;

  console.log(`Eligible companies: ${allCompanies.length} | Processing this run: ${companies.length}`);

  if (companies.length === 0) {
    console.log('No companies ready. Run "npm run start" first to generate cold emails.');
    return;
  }

  const limit = pLimit(CONCURRENCY);
  const tasks = companies.map(c => limit(() => getCompanyDecisionMakers(c)));
  await Promise.allSettled(tasks);

  console.log('\n=== Summary ===');
  console.table(getSummary());
}

main().catch(console.error);