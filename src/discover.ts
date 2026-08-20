import "dotenv/config";
import pLimit from "p-limit";
import Anthropic from "@anthropic-ai/sdk";
import { bu } from "./bu-adapter.js";
import {
  PLATFORMS,
  DISCOVERY_PROMPT,
  type DiscoveryPlatform,
} from "./prompts.js";
import { insertDiscoveredJob, getSummary, type DiscoveredJob } from "./db.js";

// ─── Clients ─────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const CONCURRENCY = parseInt(process.env.DISCOVERY_CONCURRENCY ?? "4", 10);
const MODEL = process.env.BROWSER_USE_MODEL ?? "gpt-5.4-mini";

// ─── JSON parsing with rescue chain ──────────────────────────────────────────

/** Normalises alternative key names the AI might return */
function normalizeJob(item: Record<string, unknown>): DiscoveredJob | null {
  const company_name = String(
    item.company_name ?? item.company ?? item.name ?? item.companyName ?? "",
  );
  const job_url = String(
    item.job_url ??
      item.jobUrl ??
      item.job_link ??
      item.link ??
      item.posting_url ??
      "",
  );
  const url = String(
    item.url ??
      item.company_url ??
      item.companyUrl ??
      item.website ??
      item.homepage ??
      "",
  );
  const job_ad = String(
    item.job_ad ??
      item.jobAd ??
      item.description ??
      item.job_description ??
      item.content ??
      "",
  );

  if (!company_name && !job_url) return null;
  return { company_name, job_url, url, job_ad };
}

/** Extracts the outermost [...] block from a string containing prose */
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

/** Unwraps { "jobs": [...] } style responses */
function unwrapObject(parsed: unknown): unknown[] | null {
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    return null;
  const values = Object.values(parsed as Record<string, unknown>);
  const arrayValue = values.find((v) => Array.isArray(v));
  return arrayValue ? (arrayValue as unknown[]) : null;
}

/**
 * Last resort: ask Claude Haiku to extract and reformat the data.
 * Costs ~$0.01-0.05, far cheaper than losing a full Browser Use session.
 */
async function rescueWithClaude(
  raw: string,
  platformName: string,
): Promise<DiscoveredJob[]> {
  console.warn(`  [${platformName}] Attempting Claude Haiku rescue...`);

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Extract all job listings from the text below and return them as a valid JSON array.

Each item must have exactly these keys:
- company_name (string)
- job_url (string, full URL of the job posting)
- url (string, company homepage or products page, or job board profile as fallback)
- job_ad (string, full job description text)

Use empty string "" for any missing field.
Return ONLY the raw JSON array. No markdown, no code blocks, no explanation.
Return [] if no valid jobs are found.

Text:
${raw}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") return [];

    const cleaned = content.text
      .replace(/^```json\s*/im, "")
      .replace(/^```\s*/im, "")
      .replace(/\s*```$/m, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    console.log(
      `  [${platformName}] Claude rescue extracted ${parsed.length} jobs`,
    );
    return parsed as DiscoveredJob[];
  } catch (err) {
    console.error(`  [${platformName}] Claude rescue also failed:`, err);
    return [];
  }
}

/**
 * Multi-stage parser: strips fences → tries JSON.parse → extracts embedded array
 * → normalises key names → falls back to Claude Haiku rescue if everything else fails.
 */
async function parseJobs(
  raw: string,
  platformName: string,
): Promise<DiscoveredJob[]> {
  // Stage 1: strip markdown fences
  const cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/\s*```$/m, "")
    .trim();

  let items: unknown[] | null = null;

  // Stage 2: try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      items = parsed;
    } else {
      // Stage 2b: unwrap { "jobs": [...] }
      items = unwrapObject(parsed);
    }
  } catch {
    // Stage 2c: extract array from surrounding prose
    items = extractArrayFromText(cleaned);
  }

  // Stage 3: normalise key names
  if (items && items.length > 0) {
    const normalized = items
      .map((item) => normalizeJob(item as Record<string, unknown>))
      .filter((j): j is DiscoveredJob => j !== null);

    if (normalized.length > 0) return normalized;

    console.warn(
      `  [${platformName}] Parsed ${items.length} items but none survived normalisation`,
    );
  }

  // Stage 4: Claude rescue
  console.warn(
    `  [${platformName}] Local parsing failed. Raw (first 300 chars):`,
    raw.slice(0, 300),
  );
  return rescueWithClaude(raw, platformName);
}

// ─── Per-platform discovery ───────────────────────────────────────────────────

async function discoverFromPlatform(
  platform: DiscoveryPlatform,
): Promise<void> {
  console.log(`\n[START] Searching ${platform.name}...`);

  try {
    const { output, sessionId } = await bu(DISCOVERY_PROMPT(platform), {
      agentOptions: { maxSteps: 15, stepTimeout: 90, maxFailures: 5, maxHistoryItems: 5 },
    });

    const raw =
      typeof output === "string" ? output : JSON.stringify(output ?? []);

    const jobs = await parseJobs(raw, platform.name); // parseJobs is async
    console.log(`  [${platform.name}] Found ${jobs.length} matching jobs`);

    let inserted = 0;
    let skipped = 0;

    for (const job of jobs) {
      if (!job.company_name || !job.job_url) {
        skipped++;
        continue;
      }

      const wasInserted = insertDiscoveredJob(job);
      if (wasInserted) {
        inserted++;
        console.log(`  + ${job.company_name} (${job.job_url})`);
      } else {
        skipped++;
        console.log(`  ~ Already exists: ${job.company_name}`);
      }
    }

    console.log(
      `  [${platform.name}] Done. Inserted: ${inserted}, Skipped/duplicate: ${skipped}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  [${platform.name}] Failed: ${message}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting job discovery...");

  const activePlatforms = PLATFORMS.filter((p) => p.search); // ← filter here
  console.log(
    `Platforms (active): ${activePlatforms.map((p) => p.name).join(", ")}`,
  );
  console.log(
    `Skipped: ${
      PLATFORMS.filter((p) => !p.search)
        .map((p) => p.name)
        .join(", ") || "none"
    }`,
  );
  console.log(`Concurrency: ${CONCURRENCY} | Model: ${MODEL}`);

  const limit = pLimit(CONCURRENCY);
  const tasks = activePlatforms.map(
    (
      platform, // ← use activePlatforms
    ) => limit(() => discoverFromPlatform(platform)),
  );

  await Promise.allSettled(tasks);

  console.log("\n=== Discovery Summary ===");
  console.table(getSummary());
  console.log(
    '\nRun "npm run start" to generate emails for all new pending companies.',
  );
}

main().catch(console.error);
