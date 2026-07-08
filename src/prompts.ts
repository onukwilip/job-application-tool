export const RESEARCH_PROMPT = (
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
**Interest in joining COMPANY's team as a DevOps and Platform Engineer**

You can learn more about how my experience can benefit COMPANY from **my LinkedIn and resume are added below**
https://www.linkedin.com/in/prince-onukwili-a82143233/

Hi NAME...I came across COMPANY and wanted to **share my thoughts on how your X platform's cloud infrastructure could be architected**
Here's where my experience fits...

---

• **Protect COMPANY's X service from DDoS attacks and known Common Vulnerabilities and Exploits**, so customers' requests are never blocked by an attack

We'd deploy Cloudflare's Web Application Firewall and DDoS protection in front of the public load balancers serving the Connector endpoints,

This way, **attack traffic gets filtered at the edge before it ever reaches your infrastructure.**

I've proven this before.
**I sustained an 80-100% block rate on a simulated DDoS attack while keeping a 100% success rate on real user traffic** (without real-user requests being dropped)

---

• **Ensure 99.9% availability and low-latency access for COMPANY's X service**, even if an entire cloud zone or region experiences an outage

We'd run multiple instances of every X service across multiple availability zones on the Kubernetes Cluster(s), GKE or EKS.

This way, **a single zone or VM failure never takes the X service offline for customers who need it**

I've proven this kind of reliability before.
I engineered a platform on Google Kubernetes Engine that **sustained 99.99% availability while handling 160,000+ requests per hour (roughly 3.8 million a day)**

In another project, I also engineered a highly available **CockroachDB cluster handling 7.5+ million transactions per hour**, both while serving everyday user traffic

---

• **Optimise COMPANY's cloud infrastructure costs across AWS and(or) GCP**, so growth doesn't cause you to break the bank on Cloud costs

We'd schedule staging workloads on AWS Spot Instances or GCP Preemptible VMs, since they don't need guaranteed uptime

We'd also engineer production workloads on AWS Reserved Instances or GCP Committed Use Discounts, **getting ~50 - 60% discounts.**

I've done this before. 
**I reduced a platform's monthly cloud spend from about $11,500 to $7,500 a month** by right-sizing resources and routing container logs properly.

-------------------------------------------------------------

I can't cover everything here...but I'd love to connect on a call or interview, **where I can share a detailed architectural diagram of the proposed Cloud infrastructure**

[LEARN MORE...]

**You can learn more about my experience in detail**, my projects and their case studies from my LinkedIn
https://www.linkedin.com/in/prince-onukwuli-a82143233
`;

export const POINTS_TO_USE = `
* Protecting the infra from malicious attacks, DDoS, and known Common Vulnerabilities and Exploits using Cloudflare Web Application Firewall and DDoS protection. Shield the public Load balancers which serves traffic using Cloudflare <Highlighting the DDoS simulation achievement>
* Engineer the infra setup to ensure 99.9% availability and low-latency of critical and customer-facing apps. Running multiple instances of apps across multiple VMs across availability zones, to ensure high-availability, and prevent critical apps from going down due to single-node or cloud zonal failure <Highlighting how I ensured 99.99% availability of my microservices and DB, under a load of 160k+ reqs/hr, ~3.8M+ reqs/day AND the highly-available CockroachDB cluster that handled 7.5M+ Ethereum transactions/hour, while handling everyday user traffic>
* Optimize Cloud infrastructure costs across AWS and(or) GCP, so growth doesn't cause breaking the bank. Scheduling staging workloads on AWS Spot Instances or GCP Preemptible VMs. Engineering production workloads on AWS Reserved Instances or GCP Committed Use Discounts, getting ~50 - 60% discounts <Highlighting how I reduced a platform's monthly cloud spend from about $11,500 to $7,500 a month by right-sizing resources and routing container logs properly>
`;

export const EMAIL_GENERATION_PROMPT = (companyResearch: string): string => `
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

Plain text rules (this is pasted directly into Gmail/LinkedIn, not rendered as markdown):
- The ONLY markdown syntax allowed anywhere in the output is **text** for bold
- Do NOT prefix the title, or any line, with # or ## or any other heading marker
- Do NOT use markdown lists (-, *, 1.) for the bullet points, use the • character exactly as shown in the format example
- Do NOT use backticks, underscores for italics, or any other markdown syntax
- Output must start directly with the title text itself, nothing before it

Instructions:
- Replace COMPANY with the actual company name
- Replace X and Y with the actual product or system names from the company's platform (shared below)
- Write 3-6 bullet points, each tied to a specific named system or product from this company
- Start each bullet with an action verb + the specific company system + result
- Each "We'd" paragraph should name 1-2 specific cloud services
- Each proof line should reference a real achievement from Prince's background with concrete numbers
- Do NOT reuse the same proof point stat in two different bullets
- Keep the language simple, no jargon, straight to the point
- No em dashes, use commas, brackets, or ellipses instead
- Follow the format examples above precisely, including the highlights section at the bottom
- Don't change or modify the content which are not in placeholders, keep as is. Only change the COMPANY, X, and Y placeholders
- Don't add unneccessary phrases and clauses to the points
- Keep it simple, just like the example email above

Here is the research on the company's infrastructure:
${companyResearch}
`;

// ─── Job Discovery ────────────────────────────────────────────────────────────

export interface DiscoveryPlatform {
  name: string;
  searchUrl: string;
  instructions: string;
}

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
3. Salary of over $100,000+ per year if shown — if salary is NOT shown, still include the listing
4. Posted within the last 21 days — if date is not visible, include the listing anyway

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
- Aim to return 50 - 100 matching jobs.
- Return [] if no matching jobs are found
- Do NOT wrap the JSON in markdown fences or add any explanation
`;
