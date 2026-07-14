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