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

(You can learn more about **how my experience can benefit COMPANY from my LinkedIn and resume below**
https://www.linkedin.com/in/prince-onukwili-a82143233/)

• **What if COMPANY monthly Cloud infrastructure costs reduced by 20% - 35% in the next 30 days**, without affecting its services reliability?

• **What if COMPANY could acquire SOC 2 compliance within the next 6 months** (if not currently certified), proving the security of its infrastructure and customers data?

• **What if COMPANY X and Y apps could achieve 99.9% availability** and low-latency, while handling MILLIONS of customers **within the next 30 days?**

Hi NAME...I'm Prince, I studied COMPANY services and **here're some ways I propose the Cloud infrastructure could be architected and improved to achieve the results above**

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
* Protecting the infra from malicious attacks, DDoS, and known Common Vulnerabilities and Exploits using Cloudflare Web Application Firewall and DDoS protection. Shield the public Load balancers which serves traffic using Cloudflare <Highlighting the DDoS simulation achievement>
* Engineer the infra setup to ensure 99.9% availability and low-latency of critical and customer-facing apps. Running multiple instances of apps across multiple VMs across availability zones, to ensure high-availability, and prevent critical apps from going down due to single-node or cloud zonal failure <Highlighting how I ensured 99.99% availability of my microservices and DB, under a load of 160k+ reqs/hr, ~3.8M+ reqs/day AND the highly-available CockroachDB cluster that handled 7.5M+ Ethereum transactions/hour, while handling everyday user traffic>
* Optimize Cloud infrastructure costs across AWS and(or) GCP, so growth doesn't cause breaking the bank. Scheduling staging workloads on AWS Spot Instances or GCP Preemptible VMs. Engineering production workloads on AWS Reserved Instances or GCP Committed Use Discounts, getting ~50 - 60% discounts <Highlighting how I reduced a platform's monthly cloud spend from about $11,500 to $7,500 a month by right-sizing resources and routing container logs properly>
`;

export const EMAIL_GENERATION_PROMPT = (companyResearch: string): string => `
You are helping Prince Onukwili, a Senior DevOps and Platform Engineer, write a cold outreach email to a company's engineering leadership.

Here is Prince's background:
${YOUR_BACKGROUND}

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
- Write 3-4 bullet points, each tied to a specific named system or product from this company
- Start each bullet with an action verb + the specific company system + result
- Each "We'd" paragraph should name 1-2 specific cloud services
- Each proof line should reference a real achievement from Prince's background with concrete numbers
- Do NOT reuse the same proof point stat in two different bullets
- Keep the language simple, no jargon, straight to the point
- No em dashes, use commas, brackets, or ellipses instead
- Follow the EXACT format examples above precisely, including the highlights section at the bottom
- Don't change or modify the content which are not in placeholders, KEEP AS IS. Only change the COMPANY, X, and Y placeholders
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

// --- Get Email ---

export function OUTREACH_PROMPT(companyName: string, companyUrl: string): string {
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
3. Look for their personal and company email address on GitHub profiles, speaker bios, personal websites, or contact pages, and the web in general

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation, no text before or after.

Each object must have exactly these four keys:
[
  {
    "name": "string — full name, e.g. Jane Smith",
    "title": "string — their exact role",
    "linkedin": "string — full LinkedIn URL, or null if not found",
    "email": "string — email address if found, or null if not found"
  }
]

Rules:
- Only include people you actually found evidence for — do not guess or invent names
- Return [] if you cannot find any relevant people at this company
- Do NOT wrap JSON in markdown fences
`;
}

export function APPLY_PROMPT(APPLICANT: any, jobUrl: string, coverLetterBody: string): string {
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
