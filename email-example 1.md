**Interest in joining COMPANY's team as a DevOps and Platform Engineer**
You can learn more about how my experience can benefit COMPANY from **my LinkedIn and resume are added below**
https://www.linkedin.com/in/prince-onukwili-a82143233/

Hi NAME...
I came across COMPANY and wanted to **share my thoughts on how the internal Cloud infrastructure could be architected**

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