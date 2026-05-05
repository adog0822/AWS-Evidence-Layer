# LoxeAI Pilot v2 — Evidence Tracer

Cloudflare Workers-based SOC 2 audit readiness platform. One Worker, one HTML
file, D1 + R2 + Workers AI bindings, Stripe checkout. Customer connects a
read-only AWS role; we collect evidence across 15 services and 6 regions, run
heuristic scoring instantly, and unlock full Sonnet 4.6 analysis the moment
they pay ($29.99/report).

## Two-tier flow

| Stage | What runs | Cost / time |
|---|---|---|
| Free tier | AWS evidence collection + rule-based heuristic scoring (no Claude) | ~3-5 min, AWS API calls only |
| Paid (post-Stripe) | All 12 controls analyzed by Claude Sonnet 4.6 + R2 pre-generated HTML report + Gideon copilot | ~30-60s of Claude after webhook |

The free tier is a real, useful gap-score preview — not a teaser. The paid
upgrade replaces the heuristic scoring with finding-level AI analysis and
unlocks Gideon, edits, redactions, and the print-ready report.

## Layout

```
.
├── wrangler.toml
├── migrations/0001_initial.sql      # D1 schema
└── src/
    ├── index.ts                     # Worker entry + router
    ├── types.ts                     # Shared types
    ├── aws.ts                       # SigV4 + STS AssumeRole (pure Web Crypto)
    ├── scanner.ts                   # 15 AWS service scanners + truncate-by-severity (12 concurrency)
    ├── controls.ts                  # 12 SOC 2 controls metadata + disclaimers
    ├── scoring.ts                   # FREE-TIER: rule-based heuristic gap scoring
    ├── analyzer.ts                  # PAID: Claude Sonnet 4.6 per-control analysis (final prompts)
    ├── report.ts                    # Standalone print-ready HTML report + scan delta + SHA-256
    ├── stripe.ts                    # Checkout (fixed price ID) + webhook signature verify
    ├── gideon.ts                    # Compliance copilot — context + free-form modes
    ├── auth.ts                      # download_token validation
    ├── cfn.ts                       # Customer-facing CloudFormation template
    ├── demo.ts                      # Hardcoded AcmePay demo scan
    └── html.ts                      # Single-file frontend (dark, monospace-accented)
```

## First-time setup

```bash
npm install
npx wrangler login

# Create D1 + paste database_id into wrangler.toml
npx wrangler d1 create loxeai-pilot-db

# Apply schema
npx wrangler d1 execute loxeai-pilot-db --file=migrations/0001_initial.sql --remote

# Create R2 bucket
npx wrangler r2 bucket create loxeai-pilot-reports

# Secrets
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put LOXEAI_AWS_ACCESS_KEY_ID
npx wrangler secret put LOXEAI_AWS_SECRET_ACCESS_KEY
# Optional: STRIPE_PRICE_ID (defaults to price_1TTHBLLJoCCCN5JEgSw8Ed76p)
# Optional: LOXEAI_AWS_SESSION_TOKEN

# Deploy
npx wrangler deploy

# Add the custom domain pilot.loxeai.com in the Cloudflare dashboard
# (Workers & Pages → loxeai-pilot → Settings → Domains & Routes → Add custom domain)
```

## Architecture notes

- **Scan execution**: `POST /api/scan` → enqueues evidence collection via
  `ctx.waitUntil()`. Free-tier heuristic scoring runs immediately after
  evidence collection completes; status flips to `complete`. The frontend
  polls `/status` and renders the blurred paywall over real heuristic scores.
- **Post-purchase pipeline**: Stripe `checkout.session.completed` webhook
  generates a `download_token`, then kicks off Claude analysis (3-at-a-time
  concurrency) in `waitUntil()`. After analysis completes, the report HTML +
  JSON are pre-rendered and written to R2 (`reports/{scan_id}/report.html`).
- **Severity-aware truncation**: `truncateEvidence()` parses JSON/XML, sorts
  arrays by severity, and *never drops CRITICAL findings* — even if they push
  past the 4000-char cap.
- **Scan delta**: When a previous completed scan exists for the same
  `external_id`, `report.ts` annotates each control with `previous_gap_score`
  and a `trend` pill, plus a "Fixed since last scan" / "New gaps" header.
- **Gating**: paid endpoints require `?token=` query param. The
  `/api/scan/token?session_id=...` endpoint resolves the token after Stripe
  redirects back with `?session_id={CHECKOUT_SESSION_ID}`. Token is stored in
  `localStorage` for refresh resilience.
- **Rate limit**: `scan_meter` table — 3 scans/external_id/day, 1 concurrent.

## Prompt structure (analyzer.ts)

Per-control system + user prompts implement the spec exactly:

- Sonnet 4.6 (`claude-sonnet-4-6`).
- Evidence is sorted CRITICAL → HIGH → MEDIUM → LOW before rendering into the
  prompt.
- Output is a strict JSON shape: `status`, `gap_score`, `freshness_score`,
  `audit_risk`, `summary`, `critical_findings[]`, `recommended_remediations[]`,
  `auditor_questions[]`.
- For `CC5.2`, `CC6.2`, `CC9.2`: the system prompt mandates a prominent
  process-controls disclaimer in the summary.

## Known follow-ups before public launch

- Replace `arn:aws:iam::000000000000:role/LoxeAIPilotScanner` placeholder in
  `src/cfn.ts` with the real LoxeAI scanner principal.
- Verify the `STRIPE_PRICE_ID` is live in test mode and that the webhook
  endpoint is registered in Stripe.
- Add structured logging / alerting for failed Claude calls (currently logged
  to console.error only).
