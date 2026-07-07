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

Hi NAME...I came across COMPANY and wanted to **share my thoughts on how the internal Cloud infrastructure could be architected**
Here's where my experience fits...

---

• *Protect COMPANY's X and Y platform from DDoS attacks and known Common Vulnerabilities and Exploits*, so customers' requests are never blocked by an attack

We'd put Cloudflare's Web Application Firewall and DDoS protection (which you already use) in front of the public load balancers serving the platform, **so malicious traffic gets filtered out at the edge before it ever reaches the actual Cloud infrastructure**.

I've proven this before. **I ran a full DDoS simulation that sustained an 80 - 100% block rate on attack traffic, while keeping a 100% success rate on real user traffic.**

---

• **Optimise COMPANY's cloud infrastructure costs across AWS and(or) GCP**, so growth doesn't cause you to break the bank on Cloud costs

We'd schedule staging workloads on AWS Spot Instances or GCP Preemptible VMs, since they don't need guaranteed uptime, and engineer production workloads on AWS Reserved Instances or GCP Committed Use Discounts, **getting ~50 - 60% discounts.**

We'd also keep services co-located within the same region to remove unnecessary cross-region egress charges.

I've done this before. **I reduced a platform's monthly cloud spend from about $11,500 to $7,500 a month** by right-sizing resources, co-locating services in the same region, and routing container logs properly.
---

• **Ensure 99.9% availability for COMPANY's X and Y services**, even if an entire cloud zone goes down

We'd run multiple instances of every critical service across multiple VMs and availability zones on EKS or GKE, **so a single zone or VM failure never takes the X service offline for customers who need it**. Critical, customer-facing services would get priority scheduling on the cluster.

I've proven this kind of reliability before. **I built a platform on Google Kubernetes Engine that sustained 99.99% availability while handling 160,000+ requests an hour (roughly 3.8 million a day)**, and separately **ran a highly available CockroachDB cluster that handled 7.5+ million transactions an hour**, while handling everyday user traffic.

---

• **Configure Service Level Objectives and error budgets for COMPANY's critical services**, and measure their reliability in production using their SLIs; **handling alerts and incidents using PagerDuty incident response**

We'd monitor every component using Prometheus and Grafana (already in COMPANY's stack), and trace how requests move between the wage access and repayment services using Kiali. 

We'd connect all of it into PagerDuty, **so the moment error or latency rates spike on a critical workload, an incident gets created automatically, the engineer on call gets paged**, and a dedicated Slack channel spins up for the team to resolve it together.

I've built this exact setup before. **I configured Service Level Objectives to track the reliability of my microservices and database on Google Kubernetes Engine, with automatic incident creation and team paging whenever error rates or latency skyrocketed**.

---

• **Engineer the Public and Private Key Infrastructure issuing TLS certificates across COMPANY's Kubernetes clusters**, keeping all traffic encrypted

We'd manage the Private Key Infrastructure using AWS Private CA or Google Certificate Authority Service, with cert-manager automatically issuing and renewing internal TLS certificates across every service, **so no certificate ever expires unnoticed**

I've implemented this exact pattern before. **I ran a self-managed internal Certificate Authority distributed through cert-manager, securing service-to-service traffic with mutual TLS using Istio across my own Kubernetes platform.**

---

• **Ensure COMPANY's engineers get private + secure access to COMPANY's internal Cloud resources from their remote devices, without exposing databases or internal APIs to the public internet**

We'd set up NetBird VPN (built on WireGuard) across the infrastructure, so engineers, wherever they're working from, connect through an encrypted private tunnel instead of opening anything up publicly. 

I've done this before. **I fully automated a self-hosted NetBird VPN deployment on Google Cloud using Terraform, giving engineers secure access to private databases and internal services with zero public exposure**.

---

**I can't cover everything here, but I'd love to connect on a call or interview.**
By the way, **here're some highlights of my previous experience** in the DevOps, Platform, and Cloud Engineering industry

[PLATFORM AND CLOUD ENGINEERING]

• **Engineered a highly-available and fault-tolerant CockroachDB cluster on Google Kubernetes Engine** for backfilling BTC and ETH transactions from private RPC nodes on GCP Blockchain Node Engine and Google Compute Engine **which handled up to 50k+ blocks/hour, i.e. 7.5+ million Ethereum Transactions per hour, for days in a row**, while simultaneously serving normal user traffic.

• Engineered a platform on Google Kubernetes Engine which **sustained 160k+ request traffic in an hour (up to ~3.8+ million requests in a day), and ~10k+ PostgreSQL transactions/hour with a 99.99% success rate**

• **Sustained a 80% - 100% block rate on a simulated DDoS attack against the Google Kubernetes Engine Infrastructure**, protecting the infrastructure using Cloudflare rate-limit rules and Google Cloud Firewall. **While ensuring a 100% success rate on baseline user traffic**

[SECURITY & DEVSECOPS]

• **Implemented Runtime threat-detection in the Google Kubernetes Engine Cluster using Falco**, to monitor the running containers, detect whenever malicious actions were performed on the cluster, **and inform the team via the Slack channel**

[LEARN MORE...]

**You can learn more about me, my experience (in detail)**, my projects and their case-studies from my LinkedIn
https://www.linkedin.com/in/prince-onukwili-a82143233
`;

export const POINTS_TO_USE = `
* Protecting the infra from malicious attacks, DDoS, and known Common Vulnerabilities and Exploits using Cloudflare Web Application Firewall and DDoS protection. Shield the public Load balancers which serves traffic using Cloudflare <Highlighting the DDoS simulation achievement>
* Engineer the infra setup to ensure 99.9% availability and low-latency of critical and customer-facing apps. Running multiple instances of apps across multiple VMs across availability zones, to ensure high-availability, and prevent critical apps from going down due to single-node or cloud zonal failure <Highlighting how I ensured 99.99% availability of my microservices and DB, under a load of 160k+ reqs/hr, ~3.8M+ reqs/day AND the highly-available CockroachDB cluster that handled 7.5M+ Ethereum transactions/hour, while handling everyday user traffic>
* Configuring target Service Level Objectives and error-budgets for critical workloads, and effectively monitoring and measuring how reliable they are in production via their SLIs. Monitoring all components on the Cloud infra using Prometheus and Grafana, tracing requests pathways through the microservices using Kiali. Integrating monitoring components with PagerDuty to automatically create incidents whenever critical workloads error or latency rates skyrocket, paging the engineer on duty (on-call rotation), and creating dedicated Slack channels for incidents, so team members can collaborate in resolving issues.
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
