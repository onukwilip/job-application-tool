import "dotenv/config";
import pLimit from "p-limit";
import {
  getPendingCompanies,
  updateInfrastructure,
  updateColdEmail,
  markFailed,
  getSummary,
  updateLinkedInDm,
  type Company,
} from "./db.js";
import { researchCompany } from "./research.js";
import { generateColdEmail } from "./email.js";

const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "5", 10);
const limit = pLimit(CONCURRENCY);

async function processCompany(company: Company): Promise<void> {
  console.log(`\n[START] ${company.name}`);

  try {
    // Phase 1: Research (skip if already done)
    let infrastructure = company.infrastructure;

    if (!infrastructure) {
      console.log(`  Researching ${company.name} via Browser Use...`);
      const { output, sessionId } = await researchCompany(
        company.name,
        company.urls,
        company.job_ad,
      );
      infrastructure = output;
      updateInfrastructure(company.id, infrastructure, sessionId);
      console.log(`  Research saved for ${company.name}`);
    } else {
      console.log(`  Skipping research for ${company.name} (already done)`);
    }

    // Phase 2: Email + LinkedIn DM generation (skip if already done)
    if (!company.cold_email) {
      console.log(`  Generating cold email for ${company.name}...`);

      const { email, linkedIn } = await generateColdEmail(infrastructure); // ← destructure

      updateColdEmail(company.id, email);
      if (linkedIn) updateLinkedInDm(company.id, linkedIn); // ← new DB write

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
  console.log("Starting cold email automation...");
  console.log(`Concurrency: ${CONCURRENCY}`);

  const companies = getPendingCompanies();
  console.log(`Companies to process: ${companies.length}`);

  if (companies.length === 0) {
    console.log("Nothing to process. All companies are done.");
    return;
  }

  const tasks = companies.map((company) =>
    limit(() => processCompany(company)),
  );

  await Promise.allSettled(tasks);

  console.log("\n=== Summary ===");
  const summary = getSummary();
  console.table(summary);
}

main().catch(console.error);
