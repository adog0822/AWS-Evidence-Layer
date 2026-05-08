# LoxeAI — AWS Trust Infrastructure for SOC 2

Automated AWS evidence collection and control mapping for SOC 2 Type I audits.
Read-only scan across 12 AICPA Trust Services Criteria, heuristic scoring in
minutes, full api-traceable report unlocked at $39.99.

**Live:** [pilot.loxeai.com](https://pilot.loxeai.com)

---

## What it does

1. You deploy a read-only IAM role via CloudFormation (one click, ~2 min)
2. Paste the Role ARN — we scan 15 AWS services across 6 regions
3. Free gap report in under 5 minutes: 12 controls scored, evidence catalog, gap chart
4. Pay $39.99 to unlock: Finding-level detail, CLI remediation
   commands, Gideon compliance copilot, SHA-256 traceable evidence, HTML report
   for your auditor

 No persistent access. Read-only ExternalId-bound role.
Your data deletes automatically after 30 days — or instantly on request.

---

## Two-tier flow

| Stage | What runs | Time |
|---|---|---|
| Free | Evidence collection + heuristic scoring | 3–5 min |
| Paid | Claude Sonnet 4.6 analysis × 12 controls + Gideon copilot (helps with risk assesment, remediation tracking, other parts of the SOC 2 Type l process) | ~2–5 min after payment |

---

## What's in this repo
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

The paid analysis pipeline (Anthropic prompts, report generation, Gideon,
Stripe, auth) is not in this repo. The scanner, frontend, and control
mapping are fully open — your auditor can verify exactly what API calls
we make and how findings map to controls.

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
- **AI:** Anthropic Claude Sonnet 4.5

Evidence collection fans out in parallel (12 concurrent) across services
and regions. Free-tier scoring is fully deterministic — same evidence always
produces the same scores, no model involved. Paid analysis runs each control
through Claude independently via Cloudflare Queues, 12 messages in parallel,
assembled into a final report when all complete.

Rate limit: 5 scans / ExternalId / day. 1 concurrent scan per ExternalId.

---

## Data & privacy

Every access to your scan data is logged and visible to you on the scan page.
You can delete all scan data instantly — one button, no email required.
Full data policy: [pilot.loxeai.com/methodology#data](https://pilot.loxeai.com/methodology#data)

---

## Contact

Built by [Arjav Mehta](https://www.linkedin.com/in/arjav-mehta-175284258/) ·
[mehta.arja@northeastern.edu](mailto:mehta.arja@northeastern.edu)
