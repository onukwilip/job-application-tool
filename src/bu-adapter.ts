// src/bu-adapter.ts
import "dotenv/config";
import { BrowserUse, type BuModel } from "browser-use-sdk/v3";

// ── Config ─────────────────────────────────────────────────────────────────────

const USE_LOCAL = process.env.BROWSER_USE_LOCAL === "true";
const LOCAL_URL = process.env.BROWSER_USE_LOCAL_URL ?? "http://localhost:8000";
const LOCAL_MODEL = process.env.BROWSER_USE_LOCAL_MODEL ?? "gemini-3.6-flash";
const CLOUD_API_KEY = process.env.BROWSER_USE_API_KEY!;
const CLOUD_MODEL = process.env.BROWSER_USE_MODEL as BuModel;

// Fetch timeout: 10 min. The local wrapper's own TASK_TIMEOUT_SECONDS fires
// first, so JAT always receives a clean error response rather than a hanging fetch.
const FETCH_TIMEOUT_MS = 25 * 60 * 1000;

// ── Result type ────────────────────────────────────────────────────────────────

export interface BuResult {
  output: string;
  sessionId?: number; // present on local path only; undefined on Cloud path
}

// ── Cloud client (lazy init) ───────────────────────────────────────────────────

let _cloudClient: BrowserUse | null = null;

function getCloudClient(): BrowserUse {
  if (!_cloudClient) {
    _cloudClient = new BrowserUse({ apiKey: CLOUD_API_KEY });
  }
  return _cloudClient;
}

// ── Local path ─────────────────────────────────────────────────────────────────

let _localQueue: Promise<void> = Promise.resolve();

async function _runLocal(task: string, model: string): Promise<BuResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${LOCAL_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, model }),
      signal: controller.signal,
    });
  } catch (err: any) {
    const isAbort =
      err.name === "AbortError" || // browser / node-fetch
      err.cause?.name === "AbortError" || // Node.js native fetch (undici)
      err.code === "ABORT_ERR"; // older Node.js

    throw new Error(
      isAbort
        ? `BU local: request timed out after ${FETCH_TIMEOUT_MS / 1000}s`
        : `BU local: network error — is the wrapper running at ${LOCAL_URL}? (${err.message})`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`BU local: HTTP ${response.status} — ${body}`);
  }

  const data = (await response.json()) as {
    output: string | null;
    error: string | null;
    session_id: number | null;
  };

  if (data.error) throw new Error(`BU local agent error: ${data.error}`);

  return {
    output: data.output ?? "No output returned from Browser Use",
    sessionId: data.session_id ?? undefined,
  };
}

async function runLocal(task: string, model: string): Promise<BuResult> {
  return new Promise<BuResult>((resolve, reject) => {
    _localQueue = _localQueue.then(async () => {
      try {
        resolve(await _runLocal(task, model));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ── Cloud path ─────────────────────────────────────────────────────────────────

async function runCloud(task: string, model: BuModel): Promise<BuResult> {
  const result = await getCloudClient().run(task, { model });
  // sessionId is intentionally omitted — Cloud returns no session ID.
  return {
    output: result.output ?? "No output returned from Browser Use",
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Runs a Browser Use task via BU Cloud or the local wrapper.
 * Toggle with BROWSER_USE_LOCAL in .env — no code changes needed to switch.
 *
 * `options.model` overrides the Cloud model for this call only. `options.localModel`
 * overrides the local model for this call only — kept separate from `model` because
 * Cloud and local model name spaces don't overlap (e.g. 'bu-mini' vs 'gemini-3.6-flash').
 *
 * @example
 *   const { output, sessionId } = await bu(RESEARCH_PROMPT(name, urls, jobAd));
 */
export async function bu(
  task: string,
  options: { model?: string; localModel?: string } = {},
): Promise<BuResult> {
  if (USE_LOCAL) {
    return await runLocal(task, options.localModel ?? LOCAL_MODEL);
  } else {
    return await runCloud(task, (options.model ?? CLOUD_MODEL) as BuModel);
  }
}
