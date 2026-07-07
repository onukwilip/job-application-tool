import { BrowserUse } from "browser-use-sdk/v3";
import { RESEARCH_PROMPT } from "./prompts.js";

const client = new BrowserUse({
  apiKey: process.env.BROWSER_USE_API_KEY!,
});

export async function researchCompany(
  name: string,
  urls: string,
  jobAd: string,
): Promise<string> {
  const task = RESEARCH_PROMPT(name, urls, jobAd);
  const result = await client.run(task, { model: "gpt-5.4-mini" });
  return result.output ?? "No output returned from Browser Use";
}
