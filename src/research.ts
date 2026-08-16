import { bu, type BuResult } from "./bu-adapter.js";
import { RESEARCH_PROMPT } from "./prompts.js";

export async function researchCompany(
  name: string,
  urls: string,
  jobAd: string,
): Promise<BuResult> {
  const task = RESEARCH_PROMPT(name, urls, jobAd);
  return await bu(task);
}
