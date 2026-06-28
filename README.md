# LoxeAI, A Customizable, Verifiable, & Faster SOC 2 Compliance Agent

Your first SOC 2, Done your Way
Read-only scan across 12 AICPA Trust Services Criteria, heuristic scoring in
minutes, full api-traceable report unlocked with paid report.

**Live:** [loxeai.com](https://loxeai.com)

---

## What it does

1. You deploy a read-only IAM role via CloudFormation (one click, ~2 min)
2. Paste the Role ARN, we scan 15 AWS services across 6 regions & map to 12 Core SOC 2 Controls.
3. Free gap report in minutes: 12 controls scored, evidence catalog, gap chart

**LoxeAI Full platform (Design Partner) ($349):**
Everything in the free tier, plus a full compliance workspace built 
around your specific AWS environment:
- SHA-256 signed, API-traceable evidence your auditor can verify 
  independently
- Custom controls builder: describe a check in plain English, Gideon 
  drafts it, deterministic code evaluates it
- Gideon compliance co-pilot: trained on your data, your scan findings, 
  your specific environment — drafts policies, walks through HR controls, 
  handles vendor risk assessments, prepares remediation steps
- Org-scoped workspace with full RBAC (Owner / Admin / Engineer / 
  Auditor / Viewer)
- Pre-audit readiness report: standalone, exportable, independently 
  verifiable without platform access
- Remediation queue with delta tracking across scans
- Multi-account support

 No persistent access. Read-only ExternalId-bound role.
Your data deletes automatically after 30 days, or instantly on request.

<img width="1512" height="791" alt="image" src="https://github.com/user-attachments/assets/1decbdc9-f850-4645-8d0a-1981288df963" />


---

## Two-tier architecture

| | Free (Open-Source) | Design Partner ($349) |
|---|---|---|
| AWS services | 15+ | 40+ (ECS, EKS, RDS, SQS, and more) |
| Controls | 12 core SOC 2 | 12 built-in + custom controls |
| Evidence traceability | SHA-256 hash per finding | SHA-256 + API trace + auditor-ready report |
| Custom controls | — | Plain English, deterministic evaluation |
| Compliance co-pilot | — | Gideon, trained on your data |
| Storage | Cloudflare D1 / R2 | Org-scoped Postgres + S3 |
| Retention | 30-day auto-delete | Configurable per org |
| RBAC | — | 5-role system |
| Report formats | Gap chart + CSV | HTML + JSON + CSV |

---

## How the traceability works

Every finding in the paid report is anchored to evidence like this:

```
CC6.1 · 3 IAM users without MFA
└── ev_demo_1 · iam/global/GetAccountSummary · 2026-05-07T14:22:00Z
    └── SHA-256: a3f9c2... · Raw: <AccountMFAEnabled>1</AccountMFAEnabled>
                                  <Users>14</Users><MFADevices>11</MFADevices>
```

Your auditor sees the endpoint, the timestamp, the hash, and the raw response.
The scanner is open-source, they can run the same call themselves & verify the output matches independently

<img width="1492" height="812" alt="image" src="https://github.com/user-attachments/assets/5bfaa944-4808-4d6f-a900-1abff37c29c1" />

---

## Why open-source

We believe Automation is a commodity. Verifiability is the bottleneck.

Any tool can connect to AWS and return a pass/fail list. What matters 
is whether your auditor can independently confirm where the finding 
came from without trusting your vendor's dashboard, in a customizable way built for you. Fast, and affordable. Proving Trust in a verifiable way is the biggest thing any company can do to grow explosively.

The free scanner is open-source because there is no reason to lock it 
behind one. The scan is not the moat. The evidence pipeline, the custom 
controls builder, and Gideon are.

---

## Custom controls

Custom controls let you encode your own requirements as deterministic 
checks, running on the same SHA-256 evidence pipeline as built-in controls.
User: "Require CloudWatch logs to retain at least 90 days"

↓

Gideon drafts a structured control definition

↓

Backend validates against supported check catalog

↓

Deterministic code evaluates — model never touches pass/fail logic

↓

Runs automatically on every future scan, versioned, SHA-256 signed

Competitors gate this behind enterprise tiers or require Python. 
Loxe's custom controls builder is available to every design partner 
from day one.

<img width="1512" height="802" alt="image" src="https://github.com/user-attachments/assets/a43d19c9-ab11-42b6-ac2f-c30fb00da694" />

<img width="1512" height="802" alt="image" src="https://github.com/user-attachments/assets/118b6fc5-3d28-4558-b0ea-55b6e9583c6e" />

---

## What's in this repo

 ```
src/
├── index.ts        # Cloudflare Worker entry + all API routes
├── html.ts         # Single-file frontend (dark, monospace-accented)
├── scanner.ts      # AWS evidence collection — 15 services, 6 regions
├── controls.ts     # 12 SOC 2 control definitions + AICPA mapping
├── scoring.ts      # Free-tier heuristic gap scoring (no Claude)
├── aws.ts          # SigV4 + STS AssumeRole (pure Web Crypto, no SDK)
├── cfn.ts          # Read-only CloudFormation template for customers
├── demo.ts         # AcmePay hardcoded demo scan
├── types.ts        # Shared TypeScript types
└── static-pages.ts # Methodology, Privacy, Cookies pages

migrations/
├── 0001_initial.sql       # Core schema
├── 0002_queues_gideon.sql # Queue + Gideon conversation tables
└── 0003_access_log.sql    # Data access audit log
```

The paid platform (report generation, Gideon,
Stripe, RBAC, org workspaces) is not in this repo. The scanner, frontend, and control
mapping are fully open, your auditor can verify exactly what API calls
we make and how findings map to controls.

---

## Stack

**Open Source** 
Cloudflare Workers, D1 (SQLite at edge), R2 (report storage) ·
Cloudflare Queues (parallel analysis), Stripe Checkout

Open Source Platform: No VM. No container. No persistent process. Stateless by design.
Rate limit: 5 scans / ExternalId / day.

**Design Partner platform:**
Next.js / Vercel frontend, Python FastAPI on AWS ECS Fargate, 
Org-scoped Postgres, S3, Anthropic Claude API, Stripe

---

## Self-hosting / development

```bash
npm install
npx wrangler login

# D1 database
npx wrangler d1 create loxeai-pilot-db
# paste database_id into wrangler.toml

# Apply schema
npx wrangler d1 execute loxeai-pilot-db --file=migrations/0001_initial.sql --remote
npx wrangler d1 execute loxeai-pilot-db --file=migrations/0002_queues_gideon.sql --remote
npx wrangler d1 execute loxeai-pilot-db --file=migrations/0003_access_log.sql --remote

# R2 bucket
npx wrangler r2 bucket create loxeai-pilot-reports

# Secrets
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put LOXEAI_AWS_ACCESS_KEY_ID
npx wrangler secret put LOXEAI_AWS_SECRET_ACCESS_KEY

# Deploy
npx wrangler deploy
```

---

## Architecture

- **Runtime:** Cloudflare Workers (no VM, no container, stateless)
- **Database:** Cloudflare D1 (SQLite at the edge)
- **Storage:** Cloudflare R2 (report artifacts)
- **Queue:** Cloudflare Queues (parallel Claude analysis per control)
- **Payments:** Stripe Checkout
- **AI:** Anthropic Claude Sonnet 4.6

Evidence collection fans out in parallel (12 concurrent) across services
and regions. Free-tier scoring is fully deterministic, same evidence always
produces the same scores, no model involved. Paid analysis runs each control
through Claude independently via Cloudflare Queues, 12 messages in parallel,
assembled into a final report when all complete.

Rate limit: 5 scans / ExternalId / day. 1 concurrent scan per ExternalID.

---

## Data & privacy

- Evidence lives in Cloudflare D1, auto-deleted after 30 days
- Reports in Cloudflare R2, auto-deleted after 30 days
- Long-lived AWS credentials are never retained
- IAM role sessions are 1-hour TTL, never persisted after scan
- Every data access is logged and visible to you on the scan page
- One-click deletion: wipes all evidence, findings, and report immediately

Design Partner platform: evidence in org-scoped Postgres, reports in 
private S3, retention configurable per org. Gideon receives only an 
anonymized findings summary per session,  no account IDs, ARNs, or raw 
evidence. Session context discarded on session end.

Full policy: [loxeai.com/docs](loxeai.com/docs)

---

## Contact

Built by [Arjav Mehta](https://www.linkedin.com/in/arjav-mehta-175284258/) ·
[mehta.arja@northeastern.edu](mailto:mehta.arja@northeastern.edu)

Design partner inquiries: [loxeai.com](https://loxeai.com)
