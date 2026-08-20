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
Visit ${urls} and return:
1. What the company does in 2-3 sentences
2. Their cloud provider (AWS / GCP / Azure / other)
3. Their confirmed tech stack (Kubernetes, Terraform, etc.) and(or) products/services (if any found)
4. 2 key infrastructure pain points visible from their site or job ad

Job ad for context: ${jobAd}

Be concise. Do not search beyond the provided URLs.
`;

export const YOUR_BACKGROUND = `
My background and achievements as a Senior DevOps and Platform Engineer:

[PLATFORM, SRE, AND CLOUD ENGINEERING]
- Engineered a highly-available CockroachDB cluster on GKE handling 50k+ blocks/hour (7.5M+ Ethereum transactions/hour) for days in a row, while simultaneously serving normal user traffic
- Engineered a platform on GKE sustaining 160k+ requests/hour (~3.8M+/day) and 10k+ PostgreSQL transactions/hour with 99.99% availability
- Sustained 80-100% DDoS block rate on a simulated attack while keeping 100% success on real user traffic
- Reduced cloud spend from $11,500/month to $7,500/month by right-sizing resources and optimizing egress
- Fully automated a self-hosted NetBird VPN on GCP via Terraform including Dex IdP and service user PAT creation
- Self-managed internal CA distributed through cert-manager, securing service-to-service traffic with mutual TLS using Istio
- Configured SLOs, Sloth, Grafana alerting, PagerDuty incident workflows and on-call rotations

[SECURITY & DEVSECOPS]
- Implemented runtime threat detection on GKE using Falco, alerting via Slack
- Set up a NetBird VPN with routing peers and VPC network routes, giving remote team members private, secure access to internal resources (GKE, databases, etc) with no internal resource exposed to the public internet
`;

export const EMAIL_FORMAT_EXAMPLE = `
**Interest in joining COMPANY's team as a DevOps and Platform Engineer**
You can learn more about how my experience can benefit COMPANY from **my LinkedIn and resume are added below**
https://www.linkedin.com/in/prince-onukwili-a82143233/

Hi NAME...I came across COMPANY and wanted to **share my thoughts on how the internal Cloud infrastructure could be architected**
Here's where my experience fits...

---

• [ACTION VERB] [SPECIFIC COMPANY SYSTEM] to [RESULT], [even if/so that CONDITION]

We'd [proposed implementation using 1-2 specific cloud services]

I've [done this before / proven this / implemented this exact pattern before]. [One sentence proof with concrete numbers from my background.]

---
[REPEAT FOR 3-4 POINTS]
---

I can't cover everything here, but I'd love to connect on a call or interview.

By the way, here're some highlights of my previous experience in the DevOps, Platform, and Cloud Engineering industry

[PLATFORM AND CLOUD ENGINEERING]
• [stat-heavy bullet 1]
• [stat-heavy bullet 2]
• [stat-heavy bullet 3]

[SECURITY & DEVSECOPS]
• [stat-heavy bullet]

I can't cover everything here...but I'd love to connect on a call or interview, **where I can share a detailed architectural diagram of the proposed infrastructure improvements** for the Cloud infrastructure 

[LEARN MORE...]

**You can learn more about my experience in detail**, my projects and their case studies from my LinkedIn
https://www.linkedin.com/in/prince-onukwili-a82143233/
`;

export const EXAMPLE_COLD_EMAIL = `
**Interest in joining COMPANY's team as a DevOps and Platform Engineer** 

• **What if COMPANY monthly Cloud infrastructure costs reduced by 20% - 35% in the next 30 days**, without affecting its services reliability?

• **What if COMPANY could acquire SOC 2 compliance within the next 6 months** (if not currently certified), proving the security of its infrastructure and customers data?

• **What if COMPANY X and Y apps could achieve 99.9% availability** and low-latency, while handling MILLIONS of customers **within the next 30 days?**

Hi NAME...I'm Prince, I studied COMPANY services and **here're some ways I propose the Cloud infrastructure could be architected and improved to achieve the results above**

(You can learn more about **how my experience can benefit COMPANY from my LinkedIn and Resume/CV attached**)
https://www.linkedin.com/in/prince-onukwili-a82143233/)
---

• We'd deploy Cloudflare's Web Application Firewall and DDoS protection in front of the public load balancers serving the Connector endpoints,

This way, **attack traffic gets filtered at the edge before it ever reaches your infrastructure.**

I've proven this before. **Engineered an infra on GKE Kubernetes that sustained an 80-100% block rate on a simulated DDoS attack while keeping a 100% success rate on real user traffic** (without real-user requests being dropped)

---

• We'd schedule staging workloads on AWS Spot Instances or GCP Preemptible VMs, since they don't need guaranteed uptime

We'd also **engineer production workloads on AWS Reserved Instances or GCP Committed Use Discounts, getting ~50 - 60% discounts.**

I've done this before. I **reduced a platform's monthly cloud spend from about $11,500 to $7,500 a month** by right-sizing resources and routing container logs properly.

---

• We'd run multiple instances of every X service across multiple availability zones on the Kubernetes Cluster(s), GKE or EKS.

This way, **a single zone or VM failure never takes the X service offline for customers who need it**

I've proven this kind of reliability before. **I engineered a platform on Google Kubernetes Engine that sustained 99.99% availability while handling 160,000+ requests per hour** (equivalent to 3.8 million a day)

In another project, I also **engineered a highly available CockroachDB cluster handling 7.5+ million transactions per hour**, both while serving everyday user traffic

---

• We'd manage COMPANY's Public and Private Key Infrastructure using Google Certificate Authority Service, issuing TLS certificates across every Kubernetes service

This way, **all data in transit stays encrypted, one of the core areas SOC 2 auditors check for.**

I've implemented this exact pattern before. 
**I ran a self-managed internal CA distributed through cert-manager. Also, securing service-to-service traffic with mutual TLS using Istio** 

I also **deployed Falco for runtime threat detection**, 
monitoring every running container for malicious behaviour and **alerting the team via Slack.**

-------------------------------------------------------

I can't cover everything here...but I'd love to connect on a call or interview, **where I can share a detailed architectural diagram of the proposed infrastructure improvements** for the Cloud infrastructure 

[LEARN MORE...]

**You can learn more about my experience in detail**, my projects and their case studies from my LinkedIn
https://www.linkedin.com/in/prince-onukwili-a82143233/
`;

export const POINTS_TO_USE = `
1. DDoS / Security
   Action: Deploy Cloudflare's Web Application Firewall and DDoS protection in front of the public load balancers serving the company's endpoints. Attack traffic gets filtered at the edge before it ever reaches the infrastructure.
   Proof: Engineered an infra on GKE Kubernetes that sustained an 80-100% block rate on a simulated DDoS attack while keeping a 100% success rate on real user traffic (without real-user requests being dropped)

2. Cost optimization
   Action: Schedule staging/non-critical workloads on AWS Spot Instances or GCP Preemptible VMs. Engineer production workloads on AWS Reserved Instances or GCP Committed Use Discounts, getting ~50-60% discounts.
   Proof: Reduced a platform's monthly cloud spend from about $11,500 to $7,500 a month by right-sizing resources and routing container logs properly.

3. High availability
   Action: Run multiple instances of every critical service across multiple availability zones on the Kubernetes cluster(s), GKE or EKS. A single zone or VM failure never takes the service offline for customers.
   Proof 1: Engineered a platform on Google Kubernetes Engine that sustained 99.99% availability while handling 160,000+ requests per hour (equivalent to 3.8 million a day)
   Proof 2: Engineered a highly available CockroachDB cluster handling 7.5+ million transactions per hour, both while serving everyday user traffic

4. SOC 2 compliance / PKI / security hardening
   Action: Manage the company's Public and Private Key Infrastructure using Google Certificate Authority Service, issuing TLS certificates across every Kubernetes service. All data in transit stays encrypted, one of the core areas SOC 2 auditors check for.
   Proof: Ran a self-managed internal CA distributed through cert-manager, securing service-to-service traffic with mutual TLS using Istio. Also deployed Falco for runtime threat detection, monitoring every running container for malicious behaviour and alerting the team via Slack.
`;

export const LINKEDIN_CONNECTION_TEMPLATE = `
Hey NAME, I'm Prince. I came across a DevOps & Cloud role at COMPANY.

I'd like to discuss ways to optimise COMPANY's Cloud costs, engineer 99.9% reliability for its X and Y services, and protect them from attacks.
`;

export const LINKEDIN_DM_TEMPLATE = `
Hi NAME, it's great connecting with you...
**Here're ways we could optimize COMPANY Cloud infrastructure**

---

- Reducing X & Y services monthly Cloud Costs...

I've done this in previous projects, especially one where I **Reduced monthly Google Cloud infrastructure Costs from $11,500/month to $7,500/month** by right-sizing resources and switching billing models

- Engineering 99.9% reliability for Y services...

In another project, I engineered microservices and DB on GKE which **sustained 160k+ requests/hour (equiv. to 3.8 million requests/day) with 99.99% availability** and success rate

- Protecting its X services from malicious attacks (e.g. DDoS, CVEs)

I've protected infrastructure from simulated attacks, e.g. one which **sustained an 80-100% block rate on a simulated DDoS attack while keeping a 100% success rate on user traffic**
`;

export const EMAIL_GENERATION_PROMPT = (companyResearch: string): string => `
You are helping Prince Onukwili, a Senior DevOps and Platform Engineer, write a cold outreach email to a company's engineering leadership.

Here is Prince's background:
${YOUR_BACKGROUND}

Here is a REAL finished cold email. Study its structure, tone, and bold markers carefully:
${EXAMPLE_COLD_EMAIL}

Now write a new cold email for a DIFFERENT company using the research at the bottom of this prompt.

Follow the scaffold below EXACTLY. Change only the bracketed placeholders. Every other word, phrase, sentence, and punctuation mark stays exactly as written.

SECTION 1 — TITLE (no bold, no heading prefix, output starts here)
Interest in joining [COMPANY]'s team as a DevOps and Platform Engineer

SECTION 2 — EXACTLY 3 OPENING QUESTIONS IN THIS FIXED ORDER AND ON THESE FIXED TOPICS
Bold the full question sentence each time.

SECTION 3 — LINKEDIN PARENTHETICAL (copy exactly, change only COMPANY)
(You can learn more about how my experience can benefit [COMPANY] from **my LinkedIn and Resume/CV attached**
https://www.linkedin.com/in/prince-onukwili-a82143233/)

Question 1 — topic: cost reduction (change only COMPANY):
- **What if [COMPANY]'s monthly Cloud infrastructure costs reduced by 20% - 35% in the next 30 days**, without affecting its services reliability?

Question 2 — topic: SOC 2 compliance (change only COMPANY):
- **What if [COMPANY] could acquire SOC 2 compliance within the next 6 months** (if not currently certified), proving the security of its infrastructure and customers data?

Question 3 — topic: availability (change COMPANY, and replace X and Y with real product/service names from the research):
- **What if [COMPANY] [X] and [Y] apps could achieve 99.9% availability** and low-latency, while handling MILLIONS of customers **within the next 30 days?**

SECTION 4 — INTRO LINE (copy exactly, change only COMPANY)
Hi NAME...I'm Prince, I studied [COMPANY] services and **here're some ways I propose the Cloud infrastructure could be architected and improved to achieve the results above**

SECTION 5 — EXACTLY 4 BULLET POINTS IN THIS EXACT ORDER

Each bullet follows this 3-part structure:
  Part A: "We'd..." proposal sentence. Name 1-2 specific cloud services or tools from the research. End with a comma or period. No trailing "ensuring...", "so that...", "allowing...", or "preventing..." clauses.
  Part B: "This way, **[result phrase]**." Bold the result phrase.
  Part C: "I've proven this before. **[stat with numbers]**" Bold the stat.

--- BULLET 1: DDoS protection ---
- We'd deploy Cloudflare's Web Application Firewall and DDoS protection in front of the public load balancers serving the [company's specific public-facing endpoints from the research],

This way, **attack traffic gets filtered at the edge before it ever reaches your [company's specific infrastructure].**

I've proven this before. **Engineered an infra on GKE Kubernetes that sustained an 80-100% block rate on a simulated DDoS attack while keeping a 100% success rate on real user traffic** (without real-user requests being dropped)

---

--- BULLET 2: Cost optimization ---
- We'd schedule [staging / non-critical] workloads on AWS Spot Instances or GCP Preemptible VMs, since they don't need guaranteed uptime

We'd also **engineer production workloads on AWS Reserved Instances or GCP Committed Use Discounts, getting ~50 - 60% discounts.**

I've done this before. I **reduced a platform's monthly cloud spend from about $11,500 to $7,500 a month** by right-sizing resources and routing container logs properly.

---

--- BULLET 3: High availability ---
- We'd run multiple instances of every [specific company service from the research] across multiple availability zones on the Kubernetes Cluster(s), GKE or EKS.

This way, **a single zone or VM failure never takes your [specific service] offline for customers who need it**

I've proven this kind of reliability before. **I engineered a platform on Google Kubernetes Engine that sustained 99.99% availability while handling 160,000+ requests per hour** (equivalent to 3.8 million a day)

In another project, I also **engineered a highly available CockroachDB cluster handling 7.5+ million transactions per hour**, both while serving everyday user traffic

---

--- BULLET 4: SOC 2 / PKI / security compliance ---
- We'd manage [COMPANY]'s Public and Private Key Infrastructure using Google Certificate Authority Service, issuing TLS certificates across every Kubernetes service

This way, **all data in transit stays encrypted, one of the core areas SOC 2 auditors check for.**

I've implemented this exact pattern before.
**I ran a self-managed internal CA distributed through cert-manager. Also, securing service-to-service traffic with mutual TLS using Istio**

I also **deployed Falco for runtime threat detection**,
monitoring every running container for malicious behaviour and **alerting the team via Slack.**

SECTION 6 — CLOSING (copy verbatim)
-------------------------------------------------------

I can't cover everything here...but I'd love to connect on a call or interview, **where I can share a detailed architectural diagram of the proposed infrastructure improvements** for the Cloud infrastructure

[LEARN MORE...]

**You can learn more about my experience in detail**, my projects and their case studies from my LinkedIn
https://www.linkedin.com/in/prince-onukwili-a82143233/

STRICT RULES — EACH VIOLATION MAKES THE EMAIL UNUSABLE:

1. SECTION ORDER: Output exactly 6 sections in the order shown. Do not add, remove, or reorder anything.
2. QUESTIONS: Exactly 3 opening questions. Fixed order and topics: cost reduction first, SOC 2 second, availability third. DDoS is bullet 1 in the body, NOT a question.
3. BULLETS: Exactly 4 body bullets. Fixed order: DDoS first, cost second, availability third, SOC 2/PKI fourth. Do not swap or drop any bullet.
4. BOLD MARKERS: Use **text** exactly where the scaffold shows it. Do not skip any. Do not add bold in positions the scaffold does not show.
5. PLAIN TEXT ONLY: The only markdown allowed is **text**. No #, ##, -, *, 1., backticks, or underscores anywhere.
6. BULLET CHARACTER: Use • for all bullet points, not - or *.
7. NO EM DASHES: Use commas, brackets, or ellipses instead.
8. CLEAN PART A ENDINGS: End each "We'd..." sentence cleanly. No trailing "ensuring...", "so that...", "allowing...", "preventing...", or similar clauses after the main point (excet those explicitly written in the example cold email)
9. NO REPEATED STATS: Do not use the same proof-point number in two different bullets.
10. PLACEHOLDERS ONLY: Change [COMPANY], [X], [Y], and the bracketed infrastructure names in the bullet text. Every other word stays exactly as written in the scaffold.
11. OUTPUT STARTS WITH TITLE: No preamble. The first character of output is the first character of the title.

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
`;

// ─── Job Discovery ────────────────────────────────────────────────────────────

export interface DiscoveryPlatform {
  name: string;
  searchUrl: string;
  instructions: string;
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
    name: "Google site:indeed.com - UAE remote",
    searchUrl: "https://www.google.com",
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

  {
    name: "Google site:indeed.com - Saudi Arabia remote",
    searchUrl: "https://www.google.com",
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

  // ── Direct Indeed searches (one per country) ────────────────────────────

  {
    name: "Indeed direct - Worldwide remote",
    searchUrl: "https://www.indeed.com",
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

/* export function OUTREACH_PROMPT(companyName: string, companyUrl: string): string {
  return `
You are a research assistant helping find technical decision makers at a company.

Company: ${companyName}
Website: ${companyUrl}

Your goal: find the following people at this company:
- CTO (Chief Technology Officer)
- VP of Engineering / Vice President of Engineering
- Head of Engineering / Head of DevOps / Head of Cloud / Head of Infrastructure / Head of Platform
- Co-Founder or CEO

For each person you find:
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

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation, no text before or after.

Each object must have exactly these five keys:
[
  {
    "name": "string — full name, e.g. Jane Smith",
    "title": "string — their exact role",
    "linkedin": "string — full LinkedIn URL, or null if not found",
    "work_emails": "list of strings — email address(es) at the company's own domain (matching ${companyUrl}), or null if not found",
    "personal_emails": "list of strings — email address(es) NOT at the company's domain (Gmail, Outlook, Yahoo, Hotmail, personal domain, etc.), or null if not found"
  }
]

Classification rules for emails — do NOT mix these two up:
- work_emails: ONLY addresses whose domain matches the company's own website/email domain
- personal_emails: ONLY addresses on a different domain (gmail.com, outlook.com, yahoo, hotmail, etc...a personal blog domain, etc.)
- If you are not sure which category an email belongs to, leave it out entirely rather than guessing
- The same email address must never appear in both lists

Rules:
- Only include people you actually found evidence for — do not guess or invent names
- Return [] if you cannot find any relevant people at this company
- Do NOT wrap JSON in markdown fences
`;
} */

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

export function OUTREACH_PROMPT(
  companyName: string,
  companyUrl: string,
  jobTitle?: string,
  jobUrl?: string,
): string {
  return `Find technical decision makers, the recruiter for this role, and HR contact details at ${companyName}.
${jobTitle ? `\nTarget role: ${jobTitle}` : ""}
${jobUrl ? `Job posting URL: ${jobUrl}` : ""}

── PHASE 1: Find decision makers (max 3 steps) ──────────────────────────────
1. Visit ${companyUrl}/about and ${companyUrl}/team — read the page
2. Find people with these roles: CTO, VP of Engineering, Head of Engineering /
   DevOps / Cloud / Infrastructure / Platform, Co-Founder, CEO
3. If no team page exists, do ONE Google search:
   "${companyName} CTO OR VP Engineering OR Head of Engineering"
   and read the top results only — do NOT click through

── PHASE 2: Find personal emails for decision makers (max 2 steps per person) ─
For each decision maker found (up to 4 people):

Step A — Do ONE Google search:
  "[full name]" "${companyName}" site:github.com OR site:dev.to OR site:twitter.com OR site:medium.com
  - If an email appears directly in a snippet → record it
  - If a GitHub profile URL appears in a snippet → go to Step B
  - Otherwise → move on to the next person

Step B (only if a GitHub URL appeared in snippets) — Visit that GitHub profile ONCE:
  - Check the bio section and any visible README for an email address
  - Record it and stop

Do NOT visit Twitter, Dev.to, Medium, or LinkedIn.
Do NOT run more than one search per person.

── PHASE 3: Find recruiter and HR contacts (max 3 steps) ────────────────────
${
  jobUrl
    ? `1. Visit the job posting URL: ${jobUrl}
   - Look for a recruiter name, "Posted by", "Contact", or email on the page
   - Note their name, title, and any email shown`
    : `1. Skip this step (no job URL provided)`
}

2. Visit ${companyUrl}/careers and ${companyUrl}/contact (try both):
   - Look for email addresses such as hr@, careers@, jobs@, people@, talent@, recruiting@
   - Look for a named recruiter or talent acquisition contact
   - For any inbox email found (hr@, careers@, etc.), record it as its own entry:
     · name: "" for hr@/people@ addresses, or "" for careers@/jobs@/talent@/recruiting@ addresses
     · title: "HR Email" for hr@/people@ addresses, or "Career Email" for careers@/jobs@/talent@/recruiting@ addresses
     · linkedin: null
     · work_emails: [the inbox address]
     · personal_emails: []

3. If no recruiter was found in steps 1-2, do ONE Google search:
   "${companyName}"${jobTitle ? ` "${jobTitle}"` : ""} recruiter OR "talent acquisition" OR "HR"
   - Read snippets only — do NOT click through
   - Note any recruiter name or email that appears in the snippets

── OUTPUT FORMAT ─────────────────────────────────────────────────────────────
Return ONLY a valid JSON array — no markdown, no explanation, nothing else.
Include decision makers, recruiters, and HR inboxes all in the same array.

[
  {
    "name": "Jane Smith",
    "title": "CTO",
    "linkedin": "https://linkedin.com/in/janesmith",
    "work_emails": [],
    "personal_emails": ["jane@gmail.com"]
  },
  {
    "name": "Tom Lee",
    "title": "Technical Recruiter",
    "linkedin": "https://linkedin.com/in/tomlee",
    "work_emails": ["tom@company.com"],
    "personal_emails": []
  },
  {
    "name": "",
    "title": "HR Email",
    "linkedin": null,
    "work_emails": ["hr@company.com"],
    "personal_emails": []
  },
  {
    "name": "",
    "title": "Career Email",
    "linkedin": null,
    "work_emails": ["careers@company.com"],
    "personal_emails": []
  }
]

Classification rules:
- personal_emails: ONLY addresses NOT on the company domain (Gmail, Outlook, Yahoo, personal domain, etc.)
- work_emails: ONLY addresses on the company domain, OR standard HR/careers inbox addresses found on the company site
- Never put the same address in both lists
- Always use the exact name/title/linkedin/work_emails/personal_emails structure shown above — no extra keys

General rules:
- Only include people or inboxes you found direct evidence for — never guess or invent
- Prioritise finding the recruiter for ${jobTitle ?? "the engineering role"} specifically
- Return [] if nothing relevant is found`;
}

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
