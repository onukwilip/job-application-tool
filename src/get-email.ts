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
  email?: string;
  email_address?: string;
  emailAddress?: string;
}

function normalizePerson(item: Record<string, unknown>): DecisionMaker | null {
  const raw = item as RawPerson;
  const name = String(raw.name ?? raw.full_name ?? raw.fullName ?? "").trim();
  const title = String(raw.title ?? raw.position ?? raw.role ?? "").trim();
  const linkedin = (raw.linkedin ??
    raw.linkedin_url ??
    raw.linkedinUrl ??
    null) as string | null;
  const email = (raw.email ?? raw.email_address ?? raw.emailAddress ?? null) as
    | string
    | null;

  // Must have at least a name to be worth keeping
  if (!name) return null;

  return {
    name,
    title,
    linkedin: linkedin || null,
    emails: email ? [email] : [],
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
): Promise<DecisionMaker[]> {
  console.warn(`[${companyName}] Haiku rescue...`);
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Extract all people from this text and return a valid JSON array.
Each object must have exactly these four keys:
  {
    "name": "string — full name, e.g. Jane Smith",
    "title": "string — their exact role",
    "linkedin": "string — full LinkedIn URL, or null if not found",
    "email": "string — email address if found, or null if not found"
  }
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
      .filter((p): p is DecisionMaker => p !== null);
  } catch (err) {
    console.error(`  [${companyName}] Haiku rescue failed:`, err);
    return [];
  }
}

async function parsePeople(
  raw: string,
  companyName: string,
): Promise<DecisionMaker[]> {
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
      .filter((p): p is DecisionMaker => p !== null);
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

// TODO: For each decision maker, if no email exists, try to find one using Hunter IO or Anymail Finder
async function furtherGetEmail(
  person: DecisionMaker,
  domain: string,
): Promise<DecisionMaker> {
  // Already has an email from BU — no enrichment needed
  if (person.emails.length > 0 && person.emails[0]) return person;

  const nameParts = person.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = (nameParts.slice(1).join(" ") || nameParts[0]) ?? "";

  // 1. Hunter Email Finder (name + domain)
  if (firstName && lastName && domain && HUNTER_KEY) {
    const hunterEmail = await tryHunter(firstName, lastName, domain);
    if (hunterEmail) {
      console.log(`    [Hunter] Found email for ${person.name}`);
      return { ...person, emails: [hunterEmail] };
    }
  }

  // 2a. Anymail by LinkedIn URL (if available)
  if (person.linkedin && ANYMAIL_KEY) {
    const anymailEmail = await tryAnymailByLinkedIn(person.linkedin);
    if (anymailEmail) {
      console.log(`    [Anymail/LinkedIn] Found email for ${person.name}`);
      return { ...person, emails: [anymailEmail] };
    }
  }

  // 2b. Anymail by name + domain (fallback when no LinkedIn)
  if (!person.linkedin && firstName && domain && ANYMAIL_KEY) {
    const anymailEmail = await tryAnymailByName(firstName, lastName, domain);
    if (anymailEmail) {
      console.log(`    [Anymail/Name] Found email for ${person.name}`);
      return { ...person, emails: [anymailEmail] };
    }
  }

  // Nothing found — leave email empty
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

    // Step 3: Enrich emails for anyone missing one
    const enriched = await Promise.all(
      people.map(person => furtherGetEmail(person, domain))
    );

    enriched.forEach(p => {
      const emailStatus = p.emails.length > 0 ? p.emails[0] : 'no email found';
      console.log(`  - ${p.title}: ${p.name} | ${emailStatus} | ${p.linkedin ?? 'no LinkedIn'}`);
    });

    // Step 4: Store
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