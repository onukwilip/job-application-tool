# Implementation Plan

### Project structure

```
cold-email-automator/
├── src/
│   ├── db.ts           (database setup + Company model)
│   ├── research.ts     (Browser Use research logic)
│   ├── email.ts        (Claude email generation logic)
│   ├── prompts.ts      (research + email prompt templates)
│   ├── utils.ts        (Unicode bold conversion utility)
│   └── index.ts        (main orchestration script)
├── data/
│   └── companies.xlsx  (your input spreadsheet)
├── .env
├── package.json
└── tsconfig.json
```

---

### Step 1: Initialise the project

```bash
mkdir cold-email-automator && cd cold-email-automator
npm init -y
```

---

### Step 2: Install all dependencies

```bash
# Runtime
npm install browser-use-sdk @anthropic-ai/sdk better-sqlite3 p-limit xlsx dotenv

# Dev (TypeScript + type definitions)
npm install -D typescript tsx @types/node @types/better-sqlite3
```

Package purposes:

| Package | Purpose |
|---|---|
| `browser-use-sdk` | Deep company research via real browser |
| `@anthropic-ai/sdk` | Cold email generation |
| `better-sqlite3` | Local SQLite database, synchronous |
| `p-limit` | Cap concurrent Browser Use sessions |
| `xlsx` | Read your input `.xlsx` spreadsheet |
| `tsx` | Run TypeScript directly, no build step |

---

### Step 3: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

---

### Step 4: .env file

```env
BROWSER_USE_API_KEY=bu_your_key_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
CONCURRENCY=5
```

---

### Step 5: Database module (src/db.ts)

This is your Company model and all database operations. `better-sqlite3` is synchronous so no `async/await` needed here.

```typescript
import Database from 'better-sqlite3';
import path from 'path';

export type CompanyStatus = 'pending' | 'researched' | 'done' | 'failed';

export interface Company {
  id: number;
  name: string;
  urls: string;       // comma-separated if multiple pages
  job_ad: string;
  infrastructure: string | null;
  cold_email: string | null;
  status: CompanyStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'companies.db');
const db = new Database(DB_PATH);

// Create table on first run
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    urls        TEXT NOT NULL,
    job_ad      TEXT NOT NULL DEFAULT '',
    infrastructure TEXT,
    cold_email  TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    error       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export function insertCompany(name: string, urls: string, job_ad: string = ''): void {
  db.prepare(`
    INSERT INTO companies (name, urls, job_ad)
    VALUES (?, ?, ?)
  `).run(name, urls, job_ad);
}

export function getPendingCompanies(): Company[] {
  // Fetch pending AND failed (retry failed ones)
  return db.prepare(`
    SELECT * FROM companies
    WHERE status IN ('pending', 'failed')
    ORDER BY id ASC
  `).all() as Company[];
}

export function updateInfrastructure(id: number, infrastructure: string): void {
  db.prepare(`
    UPDATE companies
    SET infrastructure = ?, status = 'researched', updated_at = datetime('now')
    WHERE id = ?
  `).run(infrastructure, id);
}

export function updateColdEmail(id: number, cold_email: string): void {
  db.prepare(`
    UPDATE companies
    SET cold_email = ?, status = 'done', updated_at = datetime('now')
    WHERE id = ?
  `).run(cold_email, id);
}

export function markFailed(id: number, error: string): void {
  db.prepare(`
    UPDATE companies
    SET status = 'failed', error = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(error, id);
}

export function getSummary() {
  return db.prepare(`
    SELECT status, COUNT(*) as count
    FROM companies
    GROUP BY status
  `).all();
}

export default db;
```

---

### Step 6: Prompt templates (src/prompts.ts)

This is where your existing research and email formats live as reusable strings.

```typescript
export const RESEARCH_PROMPT = (
  companyName: string,
  urls: string,
  jobAd: string
): string => `
Please research this company thoroughly as a Senior Platform/DevOps engineer.

Company: ${companyName}
Website pages to research: ${urls}
${jobAd ? `Job Ad:\n${jobAd}` : ''}

Research tasks:
1. Visit each URL provided and read the content
2. Search for any job postings, engineering blog posts, or tech talks
3. Identify their confirmed or likely cloud provider (AWS, GCP, Azure)
4. Identify their confirmed or likely tech stack (Kubernetes, Terraform, etc.)
5. Understand what their platform does and who uses it
6. Identify the key infrastructure engineering challenges specific to this company

Return a structured summary covering:
- What the company does (in plain, simple terms)
- Their confirmed or likely cloud infrastructure and tech stack
- Their key infrastructure pain points and engineering challenges
- Any specific product names or internal systems mentioned
`;

export const YOUR_BACKGROUND = `
My background and achievements as a Senior DevOps and Platform Engineer:

[PLATFORM AND CLOUD ENGINEERING]
- Engineered a highly-available CockroachDB cluster on GKE handling 50k+ blocks/hour (7.5M+ Ethereum transactions/hour) for days in a row, while simultaneously serving normal user traffic
- Engineered a platform on GKE sustaining 160k+ requests/hour (~3.8M+/day) and 10k+ PostgreSQL transactions/hour with 99.99% availability
- Sustained 80-100% DDoS block rate on a simulated attack while keeping 100% success on real user traffic
- Reduced cloud spend from $11,500/month to $7,500/month by right-sizing resources and optimizing egress
- Fully automated a self-hosted NetBird VPN on GCP via Terraform including Dex IdP and service user PAT creation
- Self-managed internal CA distributed through cert-manager, securing service-to-service traffic with mutual TLS using Istio
- Configured SLOs, Sloth, Grafana alerting, PagerDuty incident workflows and on-call rotations
- Resolved a 96-hour CNPG PostgreSQL cluster outage caused by stale WAL segments in GCS

[SECURITY & DEVSECOPS]
- Implemented runtime threat detection on GKE using Falco, alerting via Slack
- Zero-downtime migrations of Keycloak (MySQL to PostgreSQL) and APISIX+ETCD with mTLS end-to-end
`;

export const EMAIL_FORMAT_EXAMPLE = `
[TITLE RELATED TO COMPANY INFRA CHALLENGE]
Hi [Name], I'm Prince, I trust you're great :)

I came across [COMPANY] and wanted to share my thinking on the cloud infrastructure behind your platform and my interest in joining the infrastructure team.

I did some research and presumed how the internal infrastructure should be architected.
Here's where my experience fits directly

---

• [ACTION VERB] [SPECIFIC COMPANY SYSTEM] to [RESULT], [even if/so that CONDITION]

We'd [proposed implementation using 1-2 specific cloud services]

I've [done this before / proven this / implemented this exact pattern before]. [One sentence proof with concrete numbers from my background.]

---
[REPEAT FOR 3-6 POINTS]
---

I can't cover everything here, but I'd love to connect on a call or interview.

By the way, here're some highlights of my previous experience in the DevOps, Platform, and Cloud Engineering industry

[PLATFORM AND CLOUD ENGINEERING]
• [stat-heavy bullet 1]
• [stat-heavy bullet 2]
• [stat-heavy bullet 3]

[SECURITY & DEVSECOPS]
• [stat-heavy bullet]

[LEARN MORE...]
LinkedIn: https://www.linkedin.com/in/prince-onukwili-a82143233
`;

export const EXAMPLE_COLD_EMAIL = `
Engineering Gauntlet's blockchain data infrastructure across 12 networks

Hi Tarun, I'm Prince, I trust you're great :)

I came across Gauntlet and wanted to share my thinking on the cloud infrastructure...
[paste the full Gauntlet letter here]
`;

export const POINTS_TO_USE = `
* Protecting the infra from malicious attacks, DDoS, and known Common Vulnerabilities and Exploits using Cloudflare Web Application Firewall and DDoS protection. Shield the public Load balancers which serves traffic using Cloudflare <Highlighting the DDoS simulation achievement>
* Engineer the infra setup to ensure 99.9% availability and low-latency of critical and customer-facing apps. Running multiple instances of apps across multiple VMs across availability zones, to ensure high-availability, and prevent critical apps from going down due to single-node or cloud zonal failure <Highlighting how I ensured 99.99% availability of my microservices and DB, under a load of 160k+ reqs/hr, ~3.8M+ reqs/day>
* Enable infra sustain high-throughput by autoscaling K8s cluster VMs or Google Cloud Run instances during traffic surges. <Highlighting how I engineered DB and microservices to sustain 160k+ reqs/hr, ~3.8M+ reqs/day>
* Configuring target Service Level Objectives and error-budgets for critical workloads, and effectively monitoring and measuring how reliable they are in production via their SLIs. Monitoring all components on the Cloud infra using Prometheus and Grafana, tracing requests pathways through the microservices using Kiali. Integrating monitoring components with PagerDuty to automatically create incidents whenever critical workloads error or latency rates skyrocket, paging the engineer on duty (on-call rotation), and creating dedicated Slack channels for incidents, so team members can collaborate in resolving issues.
* Engineering the Public and Private Key Infrastructure, the Certificate Authorities and TLS Certificates, ensuring all traffic passing through the Kubernetes cluster services remain encrypted
* Ensuring team members have private + secure access to internal Cloud resources from their remote devices via Netbird VPN, without having to expose internal resources to the public internet
`

export const EMAIL_GENERATION_PROMPT = (
  companyResearch: string
): string => `
You are helping Prince Onukwili, a Senior DevOps and Platform Engineer, write a cold outreach email to a company's engineering leadership.

Here is Prince's background:
${YOUR_BACKGROUND}

Here is the email format to follow EXACTLY:
${EMAIL_FORMAT_EXAMPLE}

Here is a real example of a finished cold email to follow EXACTLY for format and tone:
${EXAMPLE_COLD_EMAIL}

Now write a new cold email for a DIFFERENT company using the research below.
Follow the same structure, tone, length, and style as the example above.

Also, use the points from below when crafting each bullet point
${POINTS_TO_USE}

Bold formatting rules:
- Use **text** around key metrics and numbers (e.g. **99.99% availability**, **160,000+ requests/hour**)
- Use **text** around specific product or system names (e.g. **SmartFunding**, **Aera vault**)
- Use **text** around the most important result phrase in each bullet point intro
- Do NOT bold generic phrases like "We'd" or "I've done this before"

Instructions:
- Write 3-6 bullet points, each tied to a specific named system or product from this company
- Start each bullet with an action verb + the specific company system + result
- Each "We'd" paragraph should name 1-2 specific cloud services
- Each proof line should reference a real achievement from Prince's background with concrete numbers
- Do NOT reuse the same proof point stat in two different bullets
- Keep the language simple, no jargon, straight to the point
- No em dashes, use commas, brackets, or ellipses instead
- Follow the format examples above precisely, including the highlights section at the bottom

Here is the research on the company's infrastructure:
${companyResearch}
`;
```

---

### Step 7: Browser Use research module (src/research.ts)

```typescript
import { BrowserUse } from 'browser-use-sdk/v3';
import { RESEARCH_PROMPT } from './prompts.js';

const client = new BrowserUse({
  apiKey: process.env.BROWSER_USE_API_KEY!,
});

export async function researchCompany(
  name: string,
  urls: string,
  jobAd: string
): Promise<string> {
  const task = RESEARCH_PROMPT(name, urls, jobAd);
  const result = await client.run(task);
  return result.output ?? 'No output returned from Browser Use';
}
```

---

### Step 8: Claude email generation module (src/email.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { EMAIL_GENERATION_PROMPT } from './prompts.js';
import { applyBold } from './utils.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateColdEmail(
  companyResearch: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: EMAIL_GENERATION_PROMPT(companyResearch),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  // Convert **bold markers** to Unicode bold characters before saving
  return applyBold(content.text);
}
```

---

### Step 8b: Unicode bold utility (src/utils.ts)

Claude returns `**text**` markers for bold. This utility converts them to Unicode bold characters, which render correctly in LinkedIn, Gmail, and most messaging apps without needing Markdown support.

```typescript
const BOLD_MAP: Record<string, string> = {
  A:'𝗔', B:'𝗕', C:'𝗖', D:'𝗗', E:'𝗘', F:'𝗙', G:'𝗚', H:'𝗛', I:'𝗜',
  J:'𝗝', K:'𝗞', L:'𝗟', M:'𝗠', N:'𝗡', O:'𝗢', P:'𝗣', Q:'𝗤', R:'𝗥',
  S:'𝗦', T:'𝗧', U:'𝗨', V:'𝗩', W:'𝗪', X:'𝗫', Y:'𝗬', Z:'𝗭',
  a:'𝗮', b:'𝗯', c:'𝗰', d:'𝗱', e:'𝗲', f:'𝗳', g:'𝗴', h:'𝗵', i:'𝗶',
  j:'𝗷', k:'𝗸', l:'𝗹', m:'𝗺', n:'𝗻', o:'𝗼', p:'𝗽', q:'𝗾', r:'𝗿',
  s:'𝘀', t:'𝘁', u:'𝘂', v:'𝘃', w:'𝘄', x:'𝘅', y:'𝘆', z:'𝘇',
  '0':'𝟬', '1':'𝟭', '2':'𝟮', '3':'𝟯', '4':'𝟰', '5':'𝟱',
  '6':'𝟲', '7':'𝟳', '8':'𝟴', '9':'𝟵',
};

function toBold(text: string): string {
  return text.split('').map(ch => BOLD_MAP[ch] ?? ch).join('');
}

export function applyBold(text: string): string {
  // Replace **any text here** with the Unicode bold equivalent
  return text.replace(/\*\*(.+?)\*\*/g, (_, inner) => toBold(inner));
}
```

---

### Step 9: xlsx importer (src/import.ts)

Run this once to load your spreadsheet into the database. The first row of your xlsx file must contain column headers: `company_name`, `urls`, `job_ad` (job_ad is optional and can be left blank for speculative outreach).

URLs in the `urls` column can be space-separated or comma-separated since they are passed directly to Browser Use as a natural language task instruction, no splitting needed.

```typescript
import 'dotenv/config';
import * as XLSX from 'xlsx';
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
```

---

### Step 10: Main orchestration script (src/index.ts)

```typescript
import 'dotenv/config';
import pLimit from 'p-limit';
import {
  getPendingCompanies,
  updateInfrastructure,
  updateColdEmail,
  markFailed,
  getSummary,
  type Company,
} from './db.js';
import { researchCompany } from './research.js';
import { generateColdEmail } from './email.js';

const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '5', 10);
const limit = pLimit(CONCURRENCY);

async function processCompany(company: Company): Promise<void> {
  console.log(`\n[START] ${company.name}`);

  try {
    // Phase 1: Research (skip if already done)
    let infrastructure = company.infrastructure;

    if (!infrastructure) {
      console.log(`  Researching ${company.name} via Browser Use...`);
      infrastructure = await researchCompany(
        company.name,
        company.urls,
        company.job_ad
      );
      updateInfrastructure(company.id, infrastructure);
      console.log(`  Research saved for ${company.name}`);
    } else {
      console.log(`  Skipping research for ${company.name} (already done)`);
    }

    // Phase 2: Email generation (skip if already done)
    if (!company.cold_email) {
      console.log(`  Generating cold email for ${company.name}...`);
      const email = await generateColdEmail(infrastructure);
      updateColdEmail(company.id, email);
      console.log(`  Email saved for ${company.name}`);
    } else {
      console.log(`  Skipping email for ${company.name} (already done)`);
    }

    console.log(`[DONE] ${company.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markFailed(company.id, message);
    console.error(`[FAILED] ${company.name}: ${message}`);
  }
}

async function main() {
  console.log('Starting cold email automation...');
  console.log(`Concurrency: ${CONCURRENCY}`);

  const companies = getPendingCompanies();
  console.log(`Companies to process: ${companies.length}`);

  if (companies.length === 0) {
    console.log('Nothing to process. All companies are done.');
    return;
  }

  const tasks = companies.map((company) =>
    limit(() => processCompany(company))
  );

  await Promise.allSettled(tasks);

  console.log('\n=== Summary ===');
  const summary = getSummary();
  console.table(summary);
}

main().catch(console.error);
```

---

### Step 11: Add scripts to package.json

```json
{
  "scripts": {
    "import": "tsx src/import.ts",
    "start":  "tsx src/index.ts"
  }
}
```

---

### Step 12: Input xlsx format

Your `data/companies.xlsx` file should have three columns with these exact header names in the first row:

| company_name | urls | job_ad |
|---|---|---|
| Open Cosmos | https://www.open-cosmos.com/about https://www.open-cosmos.com/news | [paste job ad text here, or leave blank] |
| TigerData | https://www.tigerdata.com https://www.tigerdata.com/docs | |

Notes:
- Multiple URLs in the `urls` column can be space-separated or comma-separated. Both work since the value is passed directly to Browser Use as a natural language task, no programmatic splitting is needed.
- The `job_ad` column is optional. Leave it blank for speculative outreach where you are not responding to a specific posting.
- The `job_ad` cell can contain multi-line text; xlsx handles it natively.

---

### Running the workflow

```bash
# 1. First time only: import companies into the DB
npm run import

# 2. Run the automation (can be re-run safely to retry failed companies)
npm run start
```