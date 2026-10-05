/* export const RESEARCH_PROMPT = (
  companyName: string,
  urls: string,
  jobAd: string,
): string => `
Please research this company thoroughly as a Senior Platform/DevOps engineer.

Company: ${companyName}
Website pages to research: ${urls}
${jobAd ? `Job Ad:\n${jobAd}` : ""}

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
`; */

export const RESEARCH_PROMPT = (
  companyName: string,
  urls: string,
  jobAd: string,
): string => `
Here's the company name: ${companyName}
Visit ${urls} and return:
1. What the company does in 2-3 sentences
2. Their major in house tools and shipped customer-dacing products
3. Their Cloud architecture and tech stack (Kubernetes, Terraform, Google CLoud, GKE, AKS, EKS etc.)
4. Search the company's   for 5 infrastructure pain points or issues currently being experienced, e.g. high Cloud costs, migration, SOC 2.0 compliance, etc.

Job ad for context: ${jobAd}
`;

export const YOUR_BACKGROUND = `
My background and achievements as a Senior DevOps, Cloud Platform, and Site Reliability Engineer:

[PLATFORM, FINOPS AND CLOUD ENGINEERING]
- Engineered a highly-available CockroachDB cluster on GKE which successfully ingested 50k+ blocks/hour (4M - 6M+ Ethereum transactions/hour) for days in a row, while simultaneously serving normal user traffic
- Engineered a platform on GKE which successfully processed 160k+ requests/hour (~3.8M+/day) and 10k+ PostgreSQL transactions/hour with 99.99% availability
- Protected Google Kubernetes infrastructure from a simulated DDoS attack, sustaining 80-100% block rate on the attack traffic while keeping 100% success on real user traffic, using Cloudflare Web Application Firewall (WAF) + Google Firewall
- Reduced cloud spend from $11,500/month to $7,500/month by right-sizing resources and optimizing egress
- Fully automated a self-hosted NetBird VPN, Shared VPC, and a multi-environment setup on GCP using Terraform
- Secured communication between services in the Cloud infrastructure, by engineering the Private and Public Key infrastructure using a self-managed internal CA distributed through cert-manager and Istio Service Mesh

[SITE RELIABILITY ENGINEERING]

- Measured the reliability of infrastructure, by configuring SLOs and error budgets, and measuring SLIs.
- Autoically informed the engineering teams concerning issues, before the customers noticed them using, Grafana alerting, PagerDuty incident workflows and on-call rotations

[SECURITY & DEVSECOPS]
- Auto-detected security threats on the Kubernetes cluster, during runtime using Falco, and alerting the team via Slack
- Enabled secure and private communication between remote team members devices and internal Cloud resources (e.g. Kubernetes clusters, DBs), without exposing any to the internet,using NetBird VPN with routing peers and VPC network routes.
`;

const INFRA_QUESTIONS = `
<QUESTION 1 — ALWAYS THIS DEFAULT COST QUESTION>

**What if COMPANY monthly Cloud infrastructure costs reduced by 20% - 35% in the next 30 days**, without affecting its services reliability?

<QUESTION 2 — PICK ONE BASED ON THE ROLE>

SITE RELIABILITY ENGINEERING ROLES
**What if you could set clear SLOs for the X & Y services within the next 30 days**, and guarantee that **customers always get the performance promised in the SLA?**

PLATFORM/DEVOPS ENGINEERING ROLES
**What if your X and Y apps could achieve 99.9% availability** and low-latency, while handling MILLIONS of customers **within the next 30 days?**

DEVSECOPS ENGINEERING ROLES
**What if your's X and Y infra could achieve 100% protection from DDoS and CVEs attacks within the next 30 days**, without affecting your customers traffic?
`;

export const EXAMPLE_COLD_EMAIL = `
Hey NAME,

I saw the post for a ROLE at COMPANY, and I'd like to apply and join the team in working together to save Cloud costs on the X & Z, and optimise their infrastructure; Here're 2 - 3 ways we could achieve that...


• You'd **save up to 20% - 35% on the Z monthly CLOUD expenses** by taking advantage of CLOUD_COMPUTE_DISCOUNT (up to 40% discount), and Spot Instances for staging (up to 90% discount)

• The team will get auto-informed concerning issues in the Y Cloud infrastructure via incident-response + alerting with PagerDuty, and act quickly to resolve them, **before your customers get wind of them**

• The X service will be protected from malicious attacks (DDoS, Vulnerability Exploits), **protecting your customers' data and the company's infra**; using CLOUD_WAF


One of the key milestones in a previous project was when we **reduced a platform's monthly cloud spend from about $11,500 to $7,500/month** by migrating VMs, right-sizing container resources, and routing logs properly.

I'd be happy to apply the same principles to COMPANY

PS. You can learn more about **how I've improved other companies' infra, and how I can do the same for COMPANY, from my LinkedIn & CV attached**)
https://www.linkedin.com/in/prince-onukwili-a82143233/
`;

export const LINKEDIN_CONNECTION_TEMPLATE = `
Hey NAME, 
I saw a DevOps & Cloud role at COMPANY.

I'd like to apply and join the team to work together in saving COMPANY money on its X Cloud expenses and protecting its Y platform from attacks, while engineering 99.9% reliability

Let's have a quick chat
`;

export const LINKEDIN_DM_TEMPLATE = `
Hi NAME, thanks for connecting :)...here's 1 way we could improve COMPANY's X infra together

The team could **save up to 30% on the Z monthly CLOUD expenses** by taking advantage of CLOUD_COMPUTE_DISCOUNT (up to 40% discount), and Spot Instances for staging (up to 90% discount)

A key milestone in a previous project was when we **reduced a platform's monthly cloud spend from about $11,500 to $7,500/month** by migrating VMs and right-sizing container resources.

You can learn more about me from my LinkedIn - https://www.linkedin.com/in/prince-onukwili-a82143233/
`;

export const EMAIL_GENERATION_PROMPT = (
  companyResearch: string,
  jobDescription: string,
): string => `
You are helping Prince Onukwili, a Senior DevOps and Platform Engineer, write a cold outreach email to a company's engineering leadership.

Here is Prince's background:
${YOUR_BACKGROUND}

Here is a REAL finished cold email — this is the exact structure, tone, and formatting to reproduce for the new company. Reproduce it paragraph-for-paragraph and bullet-for-bullet: same section order, same bullet counts, same bold markers. Substitute the placeholder tokens (ALL-CAPS words: NAME, ROLE, COMPANY, X, Y, Z, CLOUD, CLOUD_WAF, CLOUD_COMPUTE_DISCOUNT) per the rules below, and lightly adjust the words immediately around a substitution ONLY as needed for natural grammar (see Rule 7f) — everything else stays as written, EXCEPT Question 2, which is role-dependent (see the EXEMPTION note right after this email):
${EXAMPLE_COLD_EMAIL}

Now write a new cold email for a DIFFERENT company using the research at the bottom of this prompt, following the email above exactly, position by position:

- GREETING LINE ("Hi NAME,"): copy verbatim.
- OPENING LINE ("I saw the post for a ROLE at COMPANY..."): replace ROLE with the actual job title from the research/job description, COMPANY with the FULL company name (this is its only appearance — Rule 9), and X & Z with real service names (Rule 7a).
- THE 3 BENEFIT BULLETS (cost, auto-informed issues, protection): keep the wording, substituting the placeholder tokens — X, Y, Z, CLOUD, CLOUD_WAF, CLOUD_COMPUTE_DISCOUNT (Rule 7).
- LINKEDIN PARENTHETICAL (after the benefit bullets): change only COMPANY (short form).
- THE MILESTONE BULLET: this is Prince's real, fixed proof point — copy it 100% verbatim from the example above, word for word. It never changes based on role.

STRICT RULES — EACH VIOLATION MAKES THE EMAIL UNUSABLE:

1. STRUCTURE: Reproduce the email above exactly — same paragraphs, same bullet counts (3 benefit bullets, 1 milestone bullet), same order, same line breaks. Do not add, remove, merge, or reorder any part.
2. BOLD MARKERS: Use **text** exactly where the email above shows it. Do not skip any. Do not add bold anywhere it doesn't already appear.
3. PLAIN TEXT ONLY: The only markdown allowed is **text**. No #, ##, -, *, 1., backticks, or underscores anywhere.
4. BULLET CHARACTER: Use • for all bullet points, not - or *.
5. NO EM DASHES: Use commas, brackets, or ellipses instead.
6. PLACEHOLDERS: Resolve every ALL-CAPS placeholder token as follows:
    a. CORE SERVICES (X / Y / Z) — identify the company's core customer-facing services/products from the research:
       - 3 or more found: use three, labeled X, Y, Z, used consistently everywhere a service placeholder appears in the email.
       - Exactly 2 found: use X and Y only; omit Z wherever it would otherwise appear.
       - Exactly 1 found: use X only; omit Y and Z.
       - None found: use "customer-facing apps" in place of X; omit Y and Z.
       - If a service's real name is long, use its short/common form (e.g. "Google Kubernetes Engine" → "GKE").
    b. CLOUD — the company's primary cloud provider from the research or job description (e.g. "AWS", "Google Cloud", "Azure"). If none is identifiable, use the generic lowercase "cloud".
    c. CLOUD_WAF — that provider's Web Application Firewall product (Google Cloud: Cloud Armor; AWS: AWS WAF; Azure: Azure Web Application Firewall). If no major provider is identifiable, use "Cloudflare Web Application Firewall".
    d. CLOUD_COMPUTE_DISCOUNT — that provider's reserved/committed-use discount program (Google Cloud: Committed Use Discounts; AWS: AWS Savings Plan; Azure: Azure Reserved Instances). If no major provider is identifiable, use the generic "Savings Plan / committed-use discount pricing".
    e. If the identified provider is not AWS, GCP, or Azure, use your own knowledge of that specific provider's equivalent WAF and reserved-instance products instead of the defaults above.
    f. NATURAL PHRASING — service names must read naturally, not like mechanical find-and-replace:
       - Prefer the shortest natural form of a service name over its full formal/marketing name (e.g. "ArangoDB Contextual Data Platform" → "Data platform"). Drop a leading company-name prefix from a service name once the company is already established elsewhere in the sentence — don't write "ArangoDB's ArangoDB Data platform".
       - Capitalize only the first word of a multi-word service name; keep the rest lowercase, unless a word is a genuine proper noun, brand, or acronym (e.g. "ArangoDB", "GKE", "ETL"). Write "Data platform", not "Data Platform".
       - When two or more service placeholders in the same sentence share a common generic suffix word (e.g. "X Platform" and "Y Platform"), merge them: state each distinguishing part once, then the shared suffix once, pluralized (e.g. "Data and Internal developer platforms" instead of "Data Platform and Internal Developer Platform").
       - Before finalizing each sentence, check it for repeated words or redundant phrasing (the same service name or the company name appearing twice in a way that sounds redundant) and rephrase naturally — the placeholder substitution should never make a sentence read like a mail-merge.
    g. ROLE — use a short, natural, commonly-used form of the job title, not the literal long-form title from the posting. Drop levels, tiers, numerals, and internal grade codes (I, II, III, Junior, Senior, Staff, Principal — unless the seniority is the actual point of the sentence) and department/team qualifiers. Capitalize only the first word, same as Rule 7f. Examples: "Software Engineer II" → "Software engineer" or "Developer"; "Senior Site Reliability Engineer III" → "SRE" or "Site reliability engineer"; "Staff DevOps Engineer, Platform Team" → "DevOps engineer". Keep it recognizable and natural, the way someone would say it out loud.
8. OUTPUT STARTS WITH THE GREETING: No preamble. The first character of output is "H" in "Hi NAME".
9. COMPANY NAME — LONG VS SHORT FORM:
    Derive the short form by taking the first meaningful word of the company name
    (e.g. "Arthur Technologies" → "Arthur", "EQ Banking" → "EQ",
    "MedTech Healthcare" → "MedTech", "Wellhub (formerly Gympass)" → "Wellhub").
    Use the full company name ONLY once — in the opening line ("I saw a ROLE role at [full name]...").
    Use the short form everywhere else.
10. INFER PAIN POINTS FROM JOB DESCRIPTION:
    If the research provides no explicit infrastructure pain points, read the job
    description and company description carefully and infer likely pain points from
    what is described (e.g. a role requiring Kubernetes suggests scaling or
    reliability challenges; a role requiring cost optimisation experience implies
    cloud spend issues; a role requiring security tooling implies compliance or
    CVE exposure gaps).
    Use inferred pain points to select the role category in Rule 11 exactly as you would use explicit ones.
11. NO EMPTY RESPONSE — ALWAYS OUTPUT AN EMAIL:
    Even if the research is entirely empty or generic, you must still output a
    complete cold email in the required format. Never refuse, never explain why
    you cannot write it, never ask for more information. Use whatever is available.
    If nothing is available, reproduce the email above exactly, substituting the
    company name and falling back to the Rule 7 and Rule 11 defaults. A generic
    but correctly formatted email is always better than no email.
12. STAFFING / TALENT / CONSULTING FIRM RULE:
    If the research or job description indicates the company is a staffing agency,
    recruitment firm, talent sourcing company, or consulting firm hiring on behalf
    of a client (not for its own internal infrastructure), apply these substitutions
    throughout the email:
      - Opening line: "I saw your firm is hiring on behalf of a client for a ROLE
        role concerning optimising its X & Y Cloud infrastructure..."
      - All other references to the company's infrastructure: replace "COMPANY's
        infrastructure" with "your client's infrastructure", "COMPANY's services"
        with "your client's services", "COMPANY" in questions with "your client"
        where it refers to the end infrastructure owner.
      - Short form name still applies to the firm itself when referring to the firm
        (e.g. "Arthur" in "I'd love to connect with Arthur's team").
      - Use whatever client infrastructure details are available from the research.
        If none, apply Rule 13.
13. NO DEVOPS ROLE AVAILABLE:
    If the research or job description indicates the company has no open DevOps,
    Cloud, or infrastructure role — but is hiring for other roles (e.g. Software
    Engineer, Backend Engineer, Product Manager) — still generate the cold email.

    Modify only the opening line as follows:

    Instead of:
    "I saw a [ROLE] role at [COMPANY] concerning optimising its [X] & [Y] Cloud
    infrastructure. Here are 2 - 3 ways I propose we could do so together..."

    Use:
    "I saw that [COMPANY] was hiring [ROLE FROM RESEARCH], and I'd like to share
    2 - 3 ways we could improve its [X] and [Y] Cloud infrastructure together to
    support their growing workloads..."

    Where:
    - [COMPANY] uses the full company name (this is its only appearance)
    - [ROLE FROM RESEARCH] is the actual role title found in the research
      (e.g. "Software Engineers", "Backend Engineers", "Full Stack Developers")
    - [X] and [Y] are 1-2 core services or products inferred from the research (Rule 7a)
    - Everything else in the email follows the standard structure and rules unchanged
    - If multiple non-DevOps roles are listed, pick the most senior or most
      infrastructure-adjacent one

PART B — LINKEDIN CONNECTION REQUEST

After writing the cold email, also write a short LinkedIn connection request message.

Template to follow exactly:

${LINKEDIN_CONNECTION_TEMPLATE}

Rules for Part B:

- NAME stays as the literal word NAME — it is a placeholder replaced at send time

- COMPANY is replaced with the actual company name

- X and Y are 1-2 specific infrastructure systems or services identified in the research (e.g. "Kubernetes cluster" and "data ingestion pipeline")

- The entire message must be under 280 characters including spaces

- No bold markers, no emoji, no links — plain text only

PART C — LINKEDIN POST-CONNECTION DM

After the connection request message, write the follow-up DM to send once the connection is accepted.

Template to follow exactly:

${LINKEDIN_DM_TEMPLATE}

Rules for Part C:

- NAME stays as the literal word NAME — replaced at send time

- COMPANY is replaced with the actual company name

- X and Y are the 1-2 most specific infrastructure systems or services from the research

- Keep all **bold markers** exactly as shown — do not add or remove any

- Keep the proof point stats exactly as written — do not modify numbers or phrasing

OUTPUT FORMAT

Write your response in exactly three labeled sections, in this order:

<EMAIL>
[the full cold email exactly as you would have written it — with **bold markers** as normal]
</EMAIL>

<LINKEDIN>
[the LinkedIn connection request message — plain text only, no bold markers, under 280 characters]
</LINKEDIN>

<LINKEDIN_DM>
[the post-connection DM — follow Part C template exactly, with **bold markers** on the stat phrases]
</LINKEDIN_DM>

Do not write anything outside these three tags.

Here is the research on the company's infrastructure:
${companyResearch}

Here's the Job description
${jobDescription}
`;

// ─── Job Discovery ────────────────────────────────────────────────────────────

export interface DiscoveryPlatform {
  name: string;
  searchUrl: string;
  instructions: string;
  search: boolean; // ← true = include in discovery run, false = skip
}

/** Shared constants referenced across all discovery platform prompt entries */
const DISCOVERY = {
  PAGES: 5,
  DATE_DAYS: 21,

  /** Negative clearance keywords — appended to Google search queries */
  NEG_CLEARANCE: `-"security clearance" -"TS/SCI" -"top secret" -"secret clearance"`,

  /** Negative auth keywords — appended to Google search queries */
  NEG_AUTH: `-"must be authorized to work" -"work authorization required" -"citizens only" -"nationals only" -"residents only"`,

  /** Role keywords reused across search queries */
  ROLES: `"devops engineer" OR "platform engineer" OR "cloud engineer" OR "site reliability engineer" OR "SRE"`,

  /** Stack keywords reused across search queries */
  STACK: `"kubernetes" OR "gcp" OR "aws" OR "azure" OR "terraform"`,

  /** Contract type keywords */
  CONTRACT: `contract OR contractor OR "1099" OR "fixed-term" OR "freelance"`,

  /** Bot challenge handling — used in all direct Indeed entries */
  CAPTCHA_NOTE: `Note: If you encounter a CAPTCHA, robot check, or unusual activity page at any point: wait 15 seconds, refresh once, then continue. If it persists, collect whatever results you already have from this site and stop.`,

  /** Contract priority note — used in all entries */
  CONTRACT_PRIORITY: `Run contract/contractor searches FIRST — these roles are typically more accessible to international and remote candidates. Then run the general remote searches.`,

  /** Standard collection instruction */
  COLLECT: `For each matching posting: click into it, read the full description, and collect the company name, full job posting URL, company website or profile URL, and complete job description text.`,

  /** Standard skip instruction */
  SKIP: `Skip any posting that: requires a security clearance (mentions "security clearance", "TS/SCI", "top secret", "secret clearance"), or has no remote option.`,

  /** Standard date instruction */
  DATE: `Date posted: within the last 21 days — if the date is not visible, include the listing anyway.`,
} as const;

export const PLATFORMS: DiscoveryPlatform[] = [
  {
    name: "Google multi-platform search",
    searchUrl: "https://www.google.com",
    search: false,
    instructions: `
  Run EACH of these Google searches one at a time and collect results from each:

  1. site:jobs.lever.co ("devops engineer" OR "platform engineer" OR "cloud engineer" OR "cloud architect") "remote" ("kubernetes" OR "gcp" OR "google cloud" OR "aws" OR "azure") -"US only" -"US residents" -"work authorization required"
  2. site:jobs.ashbyhq.com ("devops engineer" OR "platform engineer" OR "cloud engineer" OR "cloud architect") "remote" ("kubernetes" OR "gcp" OR "google cloud" OR "aws" OR "azure") -"US only" -"US residents" -"work authorization required"
  3. site:wellfound.com/jobs ("devops engineer" OR "platform engineer" OR "cloud engineer") "remote" ("kubernetes" OR "google cloud" OR "gcp" OR "aws") -"US only" -"US residents"
  4. site:workatastartup.com/jobs ("devops engineer" OR "platform engineer" OR "cloud engineer") "remote" ("kubernetes" OR "google cloud" OR "gcp" OR "aws") -"US only" -"US residents"
  5. site:jobgether.com ("devops engineer" OR "platform engineer" OR "cloud engineer") "remote" ("kubernetes" OR "google cloud" OR "gcp" OR "aws") -"US only" -"US residents"
  6. site:jobs.greenhouse.io ("devops engineer" OR "platform engineer" OR "cloud engineer" OR "cloud architect") "remote" ("kubernetes" OR "gcp" OR "google cloud" OR "aws" OR "azure") -"US only" -"US residents"
  7. site:app.dover.com ("devops engineer" OR "platform engineer" OR "cloud engineer" OR "cloud architect") "remote" ("kubernetes" OR "gcp" OR "google cloud" OR "aws" OR "azure") -"US only" -"US residents"

  For EACH search:
  - Visit the first 3 pages of Google results
  - Click into each job posting
  - Skip any that say "US only", "must be eligible to work in", "requires work authorization", or restrict to a specific country
  - Collect the full job description and company URL
    `,
  },
  // ── Google site:indeed.com (one per country) ────────────────────────────

  {
    name: "Google site:indeed.com - Worldwide remote",
    searchUrl: "https://www.google.com",
    search: false,
    instructions: `
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT + REMOTE SEARCHES (run these first) ─────────────────────────────

1. site:indeed.com (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) ("worldwide remote" OR "work from anywhere" OR "remote anywhere" OR "global remote" OR "location independent") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} ${DISCOVERY.NEG_AUTH}

2. site:indeed.com (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) "remote" ("worldwide remote" OR "work from anywhere" OR "fully remote" OR "remote worldwide") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"US only" -"must be authorized"

── REMOTE SEARCHES (run these after) ────────────────────────────────────────

3. site:indeed.com (${DISCOVERY.ROLES}) ("worldwide remote" OR "work from anywhere" OR "remote anywhere" OR "global remote" OR "location independent") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} ${DISCOVERY.NEG_AUTH}

4. site:indeed.com (${DISCOVERY.ROLES}) ("fully remote" OR "remote worldwide" OR "anywhere in the world") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"US only" -"must be authorized"

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages of Google results per search
- ${DISCOVERY.DATE}
- ${DISCOVERY.SKIP}
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Google site:indeed.com - Saudi Arabia remote",
    searchUrl: "https://www.google.com",
    search: false,
    instructions: `
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT + REMOTE SEARCHES (run these first) ─────────────────────────────

1. (site:indeed.com OR site:sa.indeed.com) ("Saudi Arabia" OR Riyadh OR Jeddah) (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"Saudi nationals only"

2. (site:indeed.com OR site:sa.indeed.com) "Saudi Arabia" (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) ("visa sponsorship" OR "iqama" OR "work permit" OR "relocation") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── REMOTE SEARCHES (run these after) ────────────────────────────────────────

3. (site:indeed.com OR site:sa.indeed.com) ("Saudi Arabia" OR Riyadh OR Jeddah) (${DISCOVERY.ROLES}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"Saudi nationals only"

4. (site:indeed.com OR site:sa.indeed.com) "Saudi Arabia" (${DISCOVERY.ROLES}) ("visa sponsorship" OR "iqama" OR "work permit" OR "relocation") "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages of Google results per search
- ${DISCOVERY.DATE}
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to Saudi nationals only without offering sponsorship
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Google site:indeed.com - UAE remote",
    searchUrl: "https://www.google.com",
    search: false,
    instructions: `
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT + REMOTE SEARCHES (run these first) ─────────────────────────────

1. (site:indeed.com OR site:ae.indeed.com) (UAE OR "United Arab Emirates" OR Dubai OR "Abu Dhabi") (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"UAE nationals only"

2. (site:indeed.com OR site:ae.indeed.com) (UAE OR Dubai) (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) ("visa sponsorship" OR "work permit" OR "relocation") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── REMOTE SEARCHES (run these after) ────────────────────────────────────────

3. (site:indeed.com OR site:ae.indeed.com) (UAE OR "United Arab Emirates" OR Dubai OR "Abu Dhabi") (${DISCOVERY.ROLES}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"UAE nationals only"

4. (site:indeed.com OR site:ae.indeed.com) UAE (${DISCOVERY.ROLES}) ("visa sponsorship" OR "work permit" OR "relocation") "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages of Google results per search
- ${DISCOVERY.DATE}
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to UAE nationals only without sponsorship
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Google site:indeed.com - Netherlands remote",
    searchUrl: "https://www.google.com",
    search: false,
    instructions: `
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT + REMOTE SEARCHES (run these first) ─────────────────────────────

1. (site:indeed.com OR site:nl.indeed.com) (Netherlands OR Amsterdam OR Rotterdam) (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"EU citizens only" -"must have EU work permit"

2. (site:indeed.com OR site:nl.indeed.com) Netherlands (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) ("visa sponsorship" OR "work permit" OR "relocation" OR "highly skilled migrant" OR "HSM") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── REMOTE SEARCHES (run these after) ────────────────────────────────────────

3. (site:indeed.com OR site:nl.indeed.com) (Netherlands OR Amsterdam OR Rotterdam) (${DISCOVERY.ROLES}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"EU citizens only" -"must have EU work permit"

4. (site:indeed.com OR site:nl.indeed.com) Netherlands (${DISCOVERY.ROLES}) ("visa sponsorship" OR "highly skilled migrant" OR "HSM" OR "relocation") "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages of Google results per search
- ${DISCOVERY.DATE}
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to EU citizens only without offering a visa or work permit
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Google site:indeed.com - Canada remote",
    searchUrl: "https://www.google.com",
    search: false,
    instructions: `
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT + REMOTE SEARCHES (run these first) ─────────────────────────────

1. (site:indeed.com OR site:ca.indeed.com) Canada (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"Canadian citizens only" -"permanent residents only"

2. (site:indeed.com OR site:ca.indeed.com) Canada (${DISCOVERY.ROLES}) (${DISCOVERY.CONTRACT}) ("visa sponsorship" OR "work permit" OR "LMIA" OR "relocation") (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── REMOTE SEARCHES (run these after) ────────────────────────────────────────

3. (site:indeed.com OR site:ca.indeed.com) Canada (${DISCOVERY.ROLES}) "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE} -"Canadian citizens only" -"permanent residents only"

4. (site:indeed.com OR site:ca.indeed.com) Canada (${DISCOVERY.ROLES}) ("visa sponsorship" OR "LMIA" OR "work permit" OR "relocation") "remote" (${DISCOVERY.STACK}) ${DISCOVERY.NEG_CLEARANCE}

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages of Google results per search
- ${DISCOVERY.DATE}
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to Canadian citizens or permanent residents only without offering sponsorship
- ${DISCOVERY.COLLECT}
    `,
  },

  // ── Direct Indeed searches (one per country) ────────────────────────────

  {
    name: "Indeed direct - Worldwide remote",
    searchUrl: "https://www.indeed.com",
    search: false,
    instructions: `
Go to https://www.indeed.com
${DISCOVERY.CAPTCHA_NOTE}
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT SEARCHES (run first) ────────────────────────────────────────────

Search 1:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" OR "site reliability engineer" "work from anywhere" OR "worldwide remote" OR "global remote" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 2:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" OR "site reliability engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── REMOTE SEARCHES (run after) ──────────────────────────────────────────────

Search 3:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" "work from anywhere" OR "worldwide remote" OR "global remote" ${DISCOVERY.NEG_CLEARANCE} -"must be authorized" -"US only"
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 4:
- Search bar: site reliability engineer OR "SRE" "work from anywhere" OR "worldwide remote" ${DISCOVERY.NEG_CLEARANCE} -"must be authorized" -"US only"
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages per search
- ${DISCOVERY.SKIP}
- Also skip roles that require US work authorization or restrict to US citizens
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Indeed direct - UAE remote",
    searchUrl: "https://ae.indeed.com",
    search: true,
    instructions: `
Go to https://ae.indeed.com
${DISCOVERY.CAPTCHA_NOTE}
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT SEARCHES (run first) ────────────────────────────────────────────

Search 1:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 2:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── REMOTE SEARCHES (run after) ──────────────────────────────────────────────

Search 3:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 4:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages per search
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to UAE nationals only without sponsorship
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Indeed direct - Netherlands remote",
    searchUrl: "https://nl.indeed.com",
    search: false,
    instructions: `
Go to https://nl.indeed.com
${DISCOVERY.CAPTCHA_NOTE}
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT SEARCHES (run first) ────────────────────────────────────────────

Search 1:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 2:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── REMOTE SEARCHES (run after) ──────────────────────────────────────────────

Search 3:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 4:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages per search
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to EU citizens only without offering a visa or work permit
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Indeed direct - Canada remote",
    searchUrl: "https://ca.indeed.com",
    search: true,
    instructions: `
Go to https://ca.indeed.com
${DISCOVERY.CAPTCHA_NOTE}
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT SEARCHES (run first) ────────────────────────────────────────────

Search 1:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 2:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── REMOTE SEARCHES (run after) ──────────────────────────────────────────────

Search 3:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 4:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages per search
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to Canadian citizens or permanent residents without offering sponsorship
- ${DISCOVERY.COLLECT}
    `,
  },

  {
    name: "Indeed direct - Saudi Arabia remote",
    searchUrl: "https://sa.indeed.com",
    search: false,
    instructions: `
Go to https://sa.indeed.com
${DISCOVERY.CAPTCHA_NOTE}
${DISCOVERY.CONTRACT_PRIORITY}

── CONTRACT SEARCHES (run first) ────────────────────────────────────────────

Search 1:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 2:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Contract
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── REMOTE SEARCHES (run after) ──────────────────────────────────────────────

Search 3:
- Search bar: devops engineer OR "platform engineer" OR "cloud engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

Search 4:
- Search bar: site reliability engineer OR "SRE" OR "infrastructure engineer" ${DISCOVERY.NEG_CLEARANCE}
- Location field: Remote
- Job type filter: Any
- Date filter: Last ${DISCOVERY.DATE_DAYS} days

── RULES ─────────────────────────────────────────────────────────────────────
- Navigate up to ${DISCOVERY.PAGES} pages per search
- ${DISCOVERY.SKIP}
- Also skip roles that restrict to Saudi nationals only without offering sponsorship or iqama
- ${DISCOVERY.COLLECT}
    `,
  },
];

export const DISCOVERY_PROMPT = (platform: DiscoveryPlatform): string => `
You are a job researcher helping find DevOps and Platform Engineering roles.

Go to this URL: ${platform.searchUrl}

Platform-specific instructions:
${platform.instructions}

Your goal: find DevOps Engineer, Platform Engineer, Cloud Platform Engineer, and
Cloud/Infrastructure Engineer roles matching ALL of these criteria:

1. Listed as Remote — include any role tagged Remote or offering remote work.
   Exclude roles which explicitly state "In-office only", OR "No remote";
2. Involves cloud infrastructure, containers, Kubernetes, DevOps, or platform engineering
3. Posted within the last 21 days — if date is not visible, include the listing anyway

For EACH matching job:
1. Note the company name and the full job posting URL
2. Read the full job description text from the posting page
3. Retrieve the company's profile page on the job board

Return ONLY a valid JSON array with no extra text, no markdown, no code blocks.
Each object must have exactly these four keys:

[
  {
    "company_name": "string",
    "job_url": "string — full URL of the job posting",
    "url": "string — company profile on the job board",
    "job_ad": "string — full job description text"
  }
]

Note: use exactly these key names — company_name (not "company"), 
url (not "company_url"), job_ad (not "description").

Rules:
- Skip roles posted more than 21 days ago if the date is clearly visible
- Aim to return 50 - 200 matching jobs.
- Return [] if no matching jobs are found
- Do NOT wrap the JSON in markdown fences or add any explanation
`;

// --- Get Email ---

export function OUTREACH_PROMPT(
  companyName: string,
  companyUrl: string,
  jobTitle?: string,
  jobUrl?: string,
): string {
  return `
You are a research assistant helping find technical decision makers, the recruiter for a role, and HR/careers contacts at a company.

Company: ${companyName}
Website: ${companyUrl}
${jobTitle ? `Target role: ${jobTitle}` : ""}
${jobUrl ? `Job posting URL: ${jobUrl}` : ""}

Your goal: find the following people and contacts at this company:
- CTO (Chief Technology Officer)
- VP of Engineering / Vice President of Engineering
- Head of Engineering / Head of DevOps / Head of Cloud / Head of Infrastructure / Head of Platform
- Co-Founder or CEO
- The recruiter or talent acquisition contact for the target role, if a job posting URL is provided
- General HR / careers inbox addresses (hr@, careers@, jobs@, people@, talent@, recruiting@)

For each decision maker or recruiter you find:
1. Check the company's /about or /team page first
2. Search Google for "[Company Name] [Title] LinkedIn" to find their LinkedIn profile URL
3. Look for their personal AND company email addresses on GitHub profiles, speaker bios, personal websites, or contact pages, and the web in general
4. For each person found, search for their PERSONAL email(s) (Gmail, Outlook, personal domain) IN ADDITION to their work email:
   - Visit their GitHub profile (search: "[name] [company] github")
   - Check their Twitter/X bio
   - Check their personal website or blog if linked from LinkedIn or GitHub
   - Check their Dev.to, Hashnode, or Medium author page
   - Check conference speaker pages (KubeCon, DevOpsDays, etc.)
   - Check their npm or PyPI author page if they publish packages

To find the recruiter and HR/careers contacts:
${jobUrl ? `- Visit the job posting URL (${jobUrl}) and look for a recruiter name, "Posted by", "Contact", or email on the page` : ""}
- Visit ${companyUrl}/careers and ${companyUrl}/contact — look for a named recruiter or talent acquisition contact, and for HR/careers inbox addresses (hr@, careers@, jobs@, people@, talent@, recruiting@)
- Search Google for "${companyName}"${jobTitle ? ` "${jobTitle}"` : ""} recruiter OR "talent acquisition" OR "HR", and research any recruiter found the same way as a decision maker (LinkedIn, GitHub, personal email, etc.)
- For each HR/careers inbox address found that isn't tied to a specific named person, record it as its own entry:
  - name: ""
  - title: "HR Email" for hr@/people@ addresses, or "Career Email" for careers@/jobs@/talent@/recruiting@ addresses
  - linkedin: null
  - work_emails: [the inbox address]
  - personal_emails: []

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation, no text before or after.

Each object must have exactly these five keys:
[
  {
    "name": "string — full name, e.g. Jane Smith",
    "title": "string — their exact role, e.g. CTO, Technical Recruiter, HR Email, Career Email",
    "linkedin": "string — full LinkedIn URL, or null if not found",
    "work_emails": "list of strings — email address(es) at the company's own domain (matching ${companyUrl}), or a standard HR/careers inbox address found on the company site, or null if not found",
    "personal_emails": "list of strings — email address(es) NOT at the company's domain (Gmail, Outlook, Yahoo, Hotmail, personal domain, etc.), or null if not found"
  }
]

Classification rules for emails — do NOT mix these two up:
- work_emails: ONLY addresses whose domain matches the company's own website/email domain, or a standard HR/careers inbox address found on the company site
- personal_emails: ONLY addresses on a different domain (gmail.com, outlook.com, yahoo, hotmail, etc...a personal blog domain, etc.)
- If you are not sure which category an email belongs to, leave it out entirely rather than guessing
- The same email address must never appear in both lists

Rules:
- Only include people or inboxes you actually found evidence for — do not guess or invent names
- Prioritise finding the recruiter for ${jobTitle ?? "the role"} specifically, if a job posting URL was provided
- Return [] if you cannot find any relevant people or contacts at this company
- Do NOT wrap JSON in markdown fences
`;
}

/* export function OUTREACH_PROMPT(companyName: string, companyUrl: string): string {
  return `Find technical decision makers at ${companyName} and their personal contact emails.

── PHASE 1: Find people (max 3 steps) ───────────────────────────────────────
1. Visit ${companyUrl}/about and ${companyUrl}/team — read the page
2. Find people with these roles: CTO, VP of Engineering, Head of Engineering /
   DevOps / Cloud / Infrastructure / Platform, Co-Founder, CEO
3. If no team page exists, do ONE Google search:
   "${companyName} CTO OR VP Engineering OR Head of Engineering"
   and read the top results only — do NOT click through

── PHASE 2: Find personal emails (max 2 steps per person) ───────────────────
For each person found (up to 4 people total):

Step A — Do ONE Google search:
  "[full name]" "${companyName}" site:github.com OR site:dev.to OR site:twitter.com OR site:medium.com

  Read the search result SNIPPETS carefully:
  - If an email address appears directly in the snippet text → record it
  - If a GitHub profile URL appears in the snippets → go to Step B
  - Otherwise → move on to the next person

Step B (only if a GitHub URL was found in snippets) — Visit that GitHub profile ONCE:
  - Check the profile bio section for an email address
  - Check the pinned repos list for a contact email in READMEs — only if visible without clicking
  - Record any personal email found, then stop

Do NOT visit Twitter, Dev.to, Medium or any other site — only GitHub if its URL appeared in snippets.
Do NOT visit LinkedIn.
Do NOT run more searches per person beyond Step A.

── OUTPUT FORMAT ─────────────────────────────────────────────────────────────
Return ONLY a valid JSON array. No markdown, no explanation, nothing else:
[
  {
    "name": "Full Name",
    "title": "Their exact role",
    "linkedin": "Full LinkedIn URL, or null",
    "work_emails": [],
    "personal_emails": ["email@gmail.com"]
  }
]

Classification rules:
- personal_emails: ONLY addresses NOT on the company domain
  (Gmail, Outlook, Yahoo, Hotmail, personal domain, etc.)
- work_emails: leave as [] — enriched separately downstream
- Never put the same address in both lists

General rules:
- Only include people you found direct evidence for — never invent or guess
- Stop after finding up to 4 people
- Return [] if no matching people are found`;
} */

// export function OUTREACH_PROMPT(
//   companyName: string,
//   companyUrl: string,
//   jobTitle?: string,
//   jobUrl?: string,
// ): string {
//   return `Find technical decision makers, the recruiter for this role, and HR contact details at ${companyName}.
// ${jobTitle ? `\nTarget role: ${jobTitle}` : ""}
// ${jobUrl ? `Job posting URL: ${jobUrl}` : ""}

// ── PHASE 1: Find decision makers (max 3 steps) ──────────────────────────────
// 1. Visit ${companyUrl}/about and ${companyUrl}/team — read the page
// 2. Find people with these roles: CTO, VP of Engineering, Head of Engineering /
//    DevOps / Cloud / Infrastructure / Platform, Co-Founder, CEO
// 3. If no team page exists, do ONE Google search:
//    "${companyName} CTO OR VP Engineering OR Head of Engineering"
//    and read the top results only — do NOT click through

// ── PHASE 2: Find personal emails for decision makers (max 2 steps per person) ─
// For each decision maker found (up to 4 people):

// Step A — Do ONE Google search:
//   "[full name]" "${companyName}" site:github.com OR site:dev.to OR site:twitter.com OR site:medium.com
//   - If an email appears directly in a snippet → record it
//   - If a GitHub profile URL appears in a snippet → go to Step B
//   - Otherwise → move on to the next person

// Step B (only if a GitHub URL appeared in snippets) — Visit that GitHub profile ONCE:
//   - Check the bio section and any visible README for an email address
//   - Record it and stop

// Do NOT visit Twitter, Dev.to, Medium, or LinkedIn.
// Do NOT run more than one search per person.

// ── PHASE 3: Find recruiter and HR contacts (max 3 steps) ────────────────────
// ${
//   jobUrl
//     ? `1. Visit the job posting URL: ${jobUrl}
//    - Look for a recruiter name, "Posted by", "Contact", or email on the page
//    - Note their name, title, and any email shown`
//     : `1. Skip this step (no job URL provided)`
// }

// 2. Visit ${companyUrl}/careers and ${companyUrl}/contact (try both):
//    - Look for email addresses such as hr@, careers@, jobs@, people@, talent@, recruiting@
//    - Look for a named recruiter or talent acquisition contact
//    - For any inbox email found (hr@, careers@, etc.), record it as its own entry:
//      · name: "" for hr@/people@ addresses, or "" for careers@/jobs@/talent@/recruiting@ addresses
//      · title: "HR Email" for hr@/people@ addresses, or "Career Email" for careers@/jobs@/talent@/recruiting@ addresses
//      · linkedin: null
//      · work_emails: [the inbox address]
//      · personal_emails: []

// 3. If no recruiter was found in steps 1-2, do ONE Google search:
//    "${companyName}"${jobTitle ? ` "${jobTitle}"` : ""} recruiter OR "talent acquisition" OR "HR"
//    - Read snippets only — do NOT click through
//    - Note any recruiter name or email that appears in the snippets

// ── OUTPUT FORMAT ─────────────────────────────────────────────────────────────
// Return ONLY a valid JSON array — no markdown, no explanation, nothing else.
// Include decision makers, recruiters, and HR inboxes all in the same array.

// [
//   {
//     "name": "Jane Smith",
//     "title": "CTO",
//     "linkedin": "https://linkedin.com/in/janesmith",
//     "work_emails": [],
//     "personal_emails": ["jane@gmail.com"]
//   },
//   {
//     "name": "Tom Lee",
//     "title": "Technical Recruiter",
//     "linkedin": "https://linkedin.com/in/tomlee",
//     "work_emails": ["tom@company.com"],
//     "personal_emails": []
//   },
//   {
//     "name": "",
//     "title": "HR Email",
//     "linkedin": null,
//     "work_emails": ["hr@company.com"],
//     "personal_emails": []
//   },
//   {
//     "name": "",
//     "title": "Career Email",
//     "linkedin": null,
//     "work_emails": ["careers@company.com"],
//     "personal_emails": []
//   }
// ]

// Classification rules:
// - personal_emails: ONLY addresses NOT on the company domain (Gmail, Outlook, Yahoo, personal domain, etc.)
// - work_emails: ONLY addresses on the company domain, OR standard HR/careers inbox addresses found on the company site
// - Never put the same address in both lists
// - Always use the exact name/title/linkedin/work_emails/personal_emails structure shown above — no extra keys

// General rules:
// - Only include people or inboxes you found direct evidence for — never guess or invent
// - Prioritise finding the recruiter for ${jobTitle ?? "the engineering role"} specifically
// - Return [] if nothing relevant is found`;
// }

export function APPLY_PROMPT(
  APPLICANT: any,
  jobUrl: string,
  coverLetterBody: string,
): string {
  return `
You are submitting a job application on behalf of ${APPLICANT.firstName} ${APPLICANT.lastName}.

Visit this URL and complete the application form:
${jobUrl}

════════════════════════════════════════
PERSONAL DETAILS — use EXACTLY these values
════════════════════════════════════════
First name:    ${APPLICANT.firstName}
Last name:     ${APPLICANT.lastName}
Full name:     ${APPLICANT.firstName} ${APPLICANT.lastName}
Email:         ${APPLICANT.email}
Phone:         ${APPLICANT.phone}
City:          ${APPLICANT.city}
Country:       ${APPLICANT.country}
LinkedIn URL:  ${APPLICANT.linkedin}
Website URL:   ${APPLICANT.website}
Portfolio:     ${APPLICANT.linkedin}

════════════════════════════════════════
RESUME / CV
════════════════════════════════════════
Download this file and upload it as the resume or CV attachment:
${APPLICANT.resumeUrl}

════════════════════════════════════════
COVER LETTER
════════════════════════════════════════
If the form has a cover letter text field, paste this text exactly:

${coverLetterBody}

If the form has a cover letter FILE upload instead of a text field,
create a plain text file with the above content and upload it.

════════════════════════════════════════
STANDARD ANSWERS FOR SPECIFIC FIELDS
════════════════════════════════════════

Gender:
→ Select "${APPLICANT.gender}" or the closest available option

Race / Ethnicity:
→ Select "Decline to self-identify" or "I prefer not to answer"
  or the equivalent option. If that option does not exist, select "Other".

Veteran status:
→ Select "I am not a veteran" or "Decline to self-identify" or "No"

Disability status:
→ Select "No, I don't have a disability" or "Decline to self-identify"

Work authorization questions — answer ALL of these as YES:
→ "Are you authorized to work in [any country]?"       → YES / Yes
→ "Do you require visa sponsorship?"                   → YES / Yes
→ "Will you in the future require visa sponsorship?"   → YES / Yes
→ "Are you legally authorized to work in [country]?"   → YES / Yes
→ "Are you authorized to work where you reside?"       → YES / Yes

Salary / compensation:
→ If a single number is required: ${APPLICANT.salary}
→ If a range is required: ${APPLICANT.salaryMin} to ${APPLICANT.salaryMax}
→ If a currency selector appears: choose USD

"How did you hear about us?" / "Referral source":
→ Select "LinkedIn" if available, otherwise "Online" or "Job board"

Years of experience:
→ If required, enter ${APPLICANT.yearsExperience}

Location / remote preference:
→ If asked whether you want remote: select "Remote" or "Yes"
→ If asked for preferred location: enter "Remote — Lagos, Nigeria"

HANDLING CAPTCHA:

If a CAPTCHA challenge appears at any point:
- Do NOT stop. Attempt to solve it by clicking the correct images or elements.
- For image grid challenges, carefully select all matching images.
- After solving, continue with the submission.
- Only report failure if the CAPTCHA is re-shown after multiple solve attempts.

════════════════════════════════════════
SUBMISSION
════════════════════════════════════════
After filling ALL fields, click the final Submit button.

If the form requires creating an account BEFORE showing the application:
→ Do NOT create an account. Stop and report failure.

If a required field has no suitable answer from the information above:
→ Leave it blank if the form allows it.
→ If the field is mandatory and you have no value, report it in issues.

════════════════════════════════════════
RETURN FORMAT
════════════════════════════════════════
Return ONLY a valid JSON object — no markdown, no explanation:

{
  "success": true or false,
  "message": "one sentence describing what happened",
  "fields_filled": ["list of field names you filled in"],
  "issues": ["any fields you could not fill or problems encountered"],
  "submitted_url": "the URL where the form was on final submission"
}

HUMAN BEHAVIOUR SIMULATION — follow these for every action:
- Before clicking any field: move the mouse to it naturally and pause 1-2 seconds
- When typing into a text field: pause 0.5-1 second after clicking it before typing,
  then type at a natural pace (not instantly)
- After completing each field: pause 1-2 seconds before moving to the next
- Before clicking Submit: scroll down to review the form, then hover over 
  the Submit button for 2 seconds before clicking
- After any CAPTCHA appears: pause 3 seconds, then attempt to solve it carefully,
  then wait 3 more seconds before any next action
`;
}
