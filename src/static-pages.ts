// LoxeAI Pilot — static informational pages

const PAGE_HEAD = (title: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} · LoxeAI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..400;1,9..144,200..400&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0c0d;--panel:#0e1218;--panel-2:#131922;--border:rgba(255,255,255,0.08);--border-strong:rgba(255,255,255,0.14);--text:#e6edf3;--text-dim:rgba(255,255,255,0.65);--text-muted:rgba(255,255,255,0.42);--accent:#bfff5a;--accent-ink:#0a0c0d;--partial:#ffb74d;--font-display:'Fraunces',Georgia,serif;--font-body:'Inter Tight',system-ui,sans-serif;--font-mono:'JetBrains Mono',ui-monospace,monospace;}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font:15px/1.6 var(--font-body);-webkit-font-smoothing:antialiased;}
a{color:var(--accent);text-decoration:none;}a:hover{text-decoration:underline;}
nav.sp-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 48px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(10,12,13,0.9);backdrop-filter:blur(12px);z-index:50;}
.sp-brand{font-family:var(--font-display);font-weight:300;font-size:20px;color:var(--text);text-decoration:none;}
.sp-brand:hover{text-decoration:none;}
.sp-back{font-family:var(--font-mono);font-size:12px;color:var(--text-muted);text-decoration:none;}
.sp-back:hover{color:var(--text);text-decoration:none;}
main{max-width:740px;margin:0 auto;padding:72px 48px 96px;}
@media(max-width:640px){main{padding:48px 20px 72px;}nav.sp-nav{padding:14px 20px;}}
.sp-eyebrow{font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:var(--accent);margin-bottom:16px;display:block;}
h1{font-family:var(--font-display);font-weight:200;font-size:clamp(32px,5vw,52px);letter-spacing:-0.02em;line-height:1.08;margin:0 0 16px;}
.sp-lede{font-size:19px;color:var(--text-dim);line-height:1.5;margin:0 0 12px;max-width:560px;}
.sp-meta{font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin:0 0 56px;display:block;}
.sp-toc{margin:0 0 64px;padding:0;list-style:none;}
.sp-toc li{border-bottom:1px solid var(--border);}
.sp-toc a{display:block;padding:10px 0;font-family:var(--font-mono);font-size:13px;color:var(--text-dim);text-decoration:none;}
.sp-toc a:hover{color:var(--accent);text-decoration:none;}
.sp-section{margin-bottom:56px;}
.sp-section h2{font-family:var(--font-display);font-weight:300;font-size:28px;margin:0 0 16px;color:var(--text);}
.sp-num{font-family:var(--font-mono);font-size:13px;color:var(--text-muted);margin-right:12px;}
.sp-section p{color:var(--text-dim);margin:0 0 14px;line-height:1.65;}
.sp-section ul,.sp-section ol{color:var(--text-dim);padding-left:20px;margin:0 0 14px;}
.sp-section li{margin-bottom:6px;line-height:1.6;}
.sp-flow{list-style:none;padding:0;margin:20px 0;counter-reset:flow;}
.sp-flow li{counter-increment:flow;padding:12px 0 12px 48px;border-bottom:1px solid var(--border);font-family:var(--font-mono);font-size:13px;color:var(--text-dim);position:relative;}
.sp-flow li::before{content:counter(flow,decimal-leading-zero) " →";position:absolute;left:0;color:var(--accent);font-size:12px;}
.sp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:20px 0;}
@media(max-width:640px){.sp-grid{grid-template-columns:1fr;}}
.sp-api-card{padding:16px;border:1px solid var(--border);border-radius:6px;}
.sp-api-card h3{font-family:var(--font-mono);font-size:12px;color:var(--accent);text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;}
.sp-api-card li{font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-bottom:3px;}
.sp-ctrl-list{margin:16px 0;}
.sp-ctrl{margin-bottom:8px;}
.sp-ctrl-id{font-family:var(--font-mono);font-size:13px;color:var(--accent);margin-right:10px;}
.sp-ctrl-name{font-weight:500;font-size:14px;}
.sp-ctrl-apis{font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-top:3px;padding-left:4px;}
.sp-score-table{width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:13px;margin:16px 0;}
.sp-score-table th{text-align:left;padding:8px 12px;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border);}
.sp-score-table td{padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text-dim);}
.sp-honesty{background:rgba(255,180,77,0.04);border:1px solid var(--partial);border-radius:8px;padding:28px 32px;margin-top:48px;}
.sp-honesty h2{color:var(--partial);}
.sp-cta{margin-top:64px;padding-top:32px;border-top:1px solid var(--border);font-family:var(--font-mono);font-size:13px;color:var(--text-muted);}
.sp-cta a{color:var(--accent);}
footer.sp-foot{text-align:center;padding:32px;border-top:1px solid var(--border);font-family:var(--font-mono);font-size:12px;color:var(--text-muted);}
.sp-retention-table{width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;}
.sp-retention-table th{text-align:left;padding:8px 12px;color:var(--text-muted);font-family:var(--font-mono);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border);}
.sp-retention-table td{padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text-dim);}
</style>
</head>`;

const PAGE_NAV = `<nav class="sp-nav">
  <a href="/" class="sp-brand">LoxeAI</a>
  <a href="/" class="sp-back">← Back</a>
</nav>`;

const PAGE_FOOT = `<footer class="sp-foot">© 2026 LoxeAI · pilot.loxeai.com · read-only · ExternalId-bound</footer></body></html>`;

export function renderMethodologyPage(): string {
  return PAGE_HEAD('Methodology') + `<body>
${PAGE_NAV}
<main>
  <span class="sp-eyebrow">Methodology</span>
  <h1>No black box.<br>No vapor.</h1>
  <p class="sp-lede">How the Evidence Tracer is built, end to end. What we call, what we infer, what we store, and — at the bottom — what we're not yet claiming.</p>
  <span class="sp-meta">Pilot version: EVT v0.4 · Last updated: 5 May 2026 · Sonnet 4.6</span>

  <ul class="sp-toc">
    <li><a href="#arch">01 — Architecture</a></li>
    <li><a href="#collection">02 — Evidence collection</a></li>
    <li><a href="#mapping">03 — Control mapping</a></li>
    <li><a href="#reasoning">04 — Reasoning layer</a></li>
    <li><a href="#scoring">05 — Scoring</a></li>
    <li><a href="#traceability">06 — Traceability</a></li>
    <li><a href="#honesty">07 — Honesty note</a></li>
  </ul>

  <div class="sp-section" id="arch">
    <h2><span class="sp-num">01</span>Architecture</h2>
    <p>Stateless Cloudflare Worker. No persistent server, no VM, no container. Every scan request creates temporary AWS credentials via STS AssumeRole, runs the evidence collection, and exits. State lives in Cloudflare D1 (SQLite at the edge) for 30 days, then deletes automatically. Reports are stored in R2 object storage.</p>
    <p>The architecture was chosen for two reasons: it makes zero-credential-persistence easy to verify (no long-running process means no credential caching), and Cloudflare's infrastructure means your data doesn't pass through a server you have to trust us to secure.</p>
    <ol class="sp-flow">
      <li>You POST an IAM Role ARN + ExternalId to the Worker</li>
      <li>Worker calls STS AssumeRole for short-lived session credentials (1 hour TTL)</li>
      <li>Evidence collection fans out across AWS services using SigV4-signed requests</li>
      <li>Evidence items are written to D1, chunked per scan</li>
      <li>Claude Sonnet 4.6 runs per-control analysis against structured prompts</li>
      <li>Report is assembled from control results and stored in R2</li>
      <li>All evidence data deletes 30 days after report delivery</li>
    </ol>
    <p>No long-lived AWS credentials. No write permissions. Nothing installed in your account beyond the read-only IAM role you provision via CloudFormation.</p>
  </div>

  <div class="sp-section" id="collection">
    <h2><span class="sp-num">02</span>Evidence collection</h2>
    <p>All AWS API calls are SigV4-signed from scratch (no SDK). Calls run in parallel with a concurrency cap to avoid rate limits. Raw responses — XML or JSON — are truncated to fit within analysis context windows, but CRITICAL-severity findings are never truncated. Each response is stored as a discrete evidence item with its source endpoint, timestamp, and content hash.</p>
    <div class="sp-grid">
      <div class="sp-api-card"><h3>IAM</h3><ul>
        <li>GetAccountSummary</li><li>ListUsers</li>
        <li>GetAccountPasswordPolicy</li><li>ListGroups</li>
        <li>GetCredentialReport</li><li>ListMFADevices</li>
        <li>ListPolicies</li><li>ListRoles</li>
      </ul></div>
      <div class="sp-api-card"><h3>S3</h3><ul>
        <li>ListBuckets</li><li>GetBucketEncryption</li>
        <li>GetBucketPolicy</li><li>GetBucketVersioning</li>
        <li>GetPublicAccessBlock</li>
      </ul></div>
      <div class="sp-api-card"><h3>CloudTrail</h3><ul>
        <li>DescribeTrails</li><li>GetTrailStatus</li>
        <li>GetEventSelectors</li><li>ListTrails</li>
      </ul></div>
      <div class="sp-api-card"><h3>AWS Config</h3><ul>
        <li>DescribeConfigRules</li>
        <li>DescribeConfigurationRecorders</li>
        <li>DescribeDeliveryChannels</li>
      </ul></div>
      <div class="sp-api-card"><h3>EC2 / VPC</h3><ul>
        <li>DescribeSecurityGroups</li>
        <li>DescribeVpcs</li><li>DescribeFlowLogs</li>
        <li>DescribeInstances</li>
      </ul></div>
      <div class="sp-api-card"><h3>CloudWatch + SNS</h3><ul>
        <li>DescribeAlarms</li><li>ListMetrics</li>
        <li>ListTopics</li><li>ListSubscriptions</li>
      </ul></div>
    </div>
    <p>Additional services: KMS (ListKeys, GetKeyRotationStatus), GuardDuty (ListDetectors), SecurityHub (GetFindings, GetEnabledStandards), Secrets Manager (ListSecrets metadata only), WAF (ListWebACLs), RDS (DescribeDBInstances, DescribeDBSnapshots), Lambda, SSO.</p>
  </div>

  <div class="sp-section" id="mapping">
    <h2><span class="sp-num">03</span>Control mapping</h2>
    <p>Mapping from evidence to SOC 2 Trust Services Criteria is deterministic — the same evidence set will always produce the same control mapping. There is no learned model making this connection; it is a hand-coded rule table updated as the API coverage expands.</p>
    <div class="sp-ctrl-list">
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC6.1</span><span class="sp-ctrl-name">Logical Access — Restricted Access</span><div class="sp-ctrl-apis">Sources: IAM users, password policy, MFA status, credential report, KMS key policies</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC6.2</span><span class="sp-ctrl-name">System Access Provisioning</span><div class="sp-ctrl-apis">Sources: IAM user creation dates, group memberships, SSO configuration, access key metadata</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC6.3</span><span class="sp-ctrl-name">Role-Based Access &amp; Segregation</span><div class="sp-ctrl-apis">Sources: IAM roles, policy attachments, trust relationships, cross-account access</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC6.6</span><span class="sp-ctrl-name">External Threat Boundary</span><div class="sp-ctrl-apis">Sources: VPC configuration, security groups, WAF Web ACLs, flow logs status, EC2 instances</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC6.7</span><span class="sp-ctrl-name">Restricted Data Movement &amp; Encryption</span><div class="sp-ctrl-apis">Sources: S3 encryption &amp; public access, KMS keys &amp; rotation, RDS encryption, Secrets Manager</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC7.1</span><span class="sp-ctrl-name">Configuration &amp; Vulnerability Management</span><div class="sp-ctrl-apis">Sources: AWS Config recorders, delivery channels, Config rules compliance</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC7.2</span><span class="sp-ctrl-name">Security Event Monitoring</span><div class="sp-ctrl-apis">Sources: CloudTrail trails, multi-region flag, log validation, event selectors, CloudWatch alarms</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC7.3</span><span class="sp-ctrl-name">Anomaly Detection</span><div class="sp-ctrl-apis">Sources: GuardDuty detectors, CloudWatch alarms, SNS topics, CloudWatch metrics</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC7.4</span><span class="sp-ctrl-name">Incident Response</span><div class="sp-ctrl-apis">Sources: SecurityHub findings, GuardDuty status, SNS subscriptions, Security Hub standards</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC8.1</span><span class="sp-ctrl-name">Change Management</span><div class="sp-ctrl-apis">Sources: CloudTrail event selectors, Config rules, Lambda function inventory</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC5.2</span><span class="sp-ctrl-name">Technology Controls</span><div class="sp-ctrl-apis">Sources: AWS Config, SecurityHub standards, GuardDuty, Config rules</div></div>
      <div class="sp-ctrl"><span class="sp-ctrl-id">CC9.2</span><span class="sp-ctrl-name">Business Continuity &amp; Recovery</span><div class="sp-ctrl-apis">Sources: RDS snapshots and backup retention, S3 versioning &amp; replication status</div></div>
    </div>
    <p>Because the mapping is deterministic, every gap finding traces directly to a specific API call and response field. There is no "the AI decided" — there is "this API call returned Encrypted: false, here it is."</p>
  </div>

  <div class="sp-section" id="reasoning">
    <h2><span class="sp-num">04</span>Reasoning layer</h2>
    <p>After evidence is collected and heuristic scores are computed, each of the 12 controls is analyzed individually by Claude Sonnet 4.6. Each call receives a structured prompt containing: the control definition (AICPA criteria), the relevant evidence items for that control, and a JSON schema for the expected output.</p>
    <p>The model is instructed to: cite specific evidence IDs in every finding, avoid hallucinating controls or permissions not present in the evidence, flag when evidence is insufficient rather than guessing, and produce copy-pasteable AWS CLI remediation commands anchored to real resource ARNs from the evidence.</p>
    <p>The output contract is enforced: if the model returns malformed JSON or omits required fields, the call is retried. If a call fails after retries (including rate-limit backoff via Cloudflare Queues), the control is marked inconclusive rather than silently dropped.</p>
    <p>Each control analysis runs in its own queue message with a 30-second wall-time limit. All 12 run in parallel (at 2 concurrent to avoid Anthropic rate limits). Total analysis time: 60–120 seconds for a typical account.</p>
  </div>

  <div class="sp-section" id="scoring">
    <h2><span class="sp-num">05</span>Scoring</h2>
    <p>Two scores are computed for each scan. Both are 0–100. Neither maps to a binary "audit-ready" claim.</p>
    <p><strong>Gap Score</strong> — percentage of checkpoints meeting their thresholds, weighted by severity of failing findings:</p>
    <table class="sp-score-table">
      <thead><tr><th>Finding severity</th><th>Score deduction</th></tr></thead>
      <tbody>
        <tr><td>CRITICAL</td><td>−25 points</td></tr>
        <tr><td>HIGH</td><td>−15 points</td></tr>
        <tr><td>MEDIUM</td><td>−5 points</td></tr>
        <tr><td>LOW / INFO</td><td>−1 point</td></tr>
      </tbody>
    </table>
    <table class="sp-score-table" style="margin-top:8px;">
      <thead><tr><th>Score range</th><th>Interpretation</th></tr></thead>
      <tbody>
        <tr><td>80–100</td><td>Low audit risk — known gaps, manageable</td></tr>
        <tr><td>60–79</td><td>Moderate — auditor will likely raise findings</td></tr>
        <tr><td>&lt;60</td><td>High — remediate before scheduling audit</td></tr>
      </tbody>
    </table>
    <p><strong>Freshness Score</strong> — recency of the evidence underpinning the analysis. Inputs: IAM access key age vs 90-day rotation policy, credential last-used dates, CloudTrail log delivery recency, Config rule last-evaluation timestamps. Below 70 indicates configurations that auditors commonly flag for staleness.</p>
  </div>

  <div class="sp-section" id="traceability">
    <h2><span class="sp-num">06</span>Traceability</h2>
    <p>Every finding in the paid report is anchored to the evidence that produced it. Each evidence item carries:</p>
    <ul>
      <li>The exact AWS API endpoint called (e.g. <code>iam.amazonaws.com/GetAccountSummary</code>)</li>
      <li>The request timestamp in ISO 8601 UTC</li>
      <li>The raw response body (truncated if &gt;50KB, but CRITICAL findings are never truncated)</li>
      <li>A SHA-256 hash of the evidence item for tamper-evidence</li>
      <li>The AWS region the call was issued against</li>
    </ul>
    <p>Because the scanner is open-source, an auditor can clone the repo, point it at their client's account, run the exact same calls, and verify that our evidence matches what they collect independently. The hash creates a chain of custody between the raw response and the finding that cited it.</p>
    <p>This is why the scan is open-source. Not as a values statement — as a trust mechanism. You can check our work because the work is checkable.</p>
  </div>

  <div class="sp-honesty" id="honesty">
    <h2><span class="sp-num">07</span>What we're not yet claiming</h2>
    <p>The SOC 2 framework covers nine criteria series. AWS API calls can surface evidence for roughly 15–20% of those criteria — the parts with API endpoints. The remaining 80% (governance processes, risk assessments, written policies, access reviews, vendor risk, HR controls, incident response exercises) have no API. We don't assess those.</p>
    <p>"Pre-audit readiness" means the AWS infrastructure layer is assessed. It does not mean your auditor will have no findings. It means you'll have fewer surprises on the technical side, and the ones you do have will come with traceable evidence and copy-pasteable CLI commands to fix them.</p>
    <p>We don't publish an accuracy number. We don't have one that's meaningful enough to publish yet.</p>
    <p>This is a Type I tool. Continuous monitoring (Type II evidence collection over time) is on the roadmap, not shipped.</p>
  </div>

  <div class="sp-cta">Questions, corrections, or methodology challenges — <a href="mailto:arjav@loxeai.com">talk to the founder directly</a>.
  </div>
</main>
${PAGE_FOOT}`;
}

export function renderPrivacyPage(): string {
  return PAGE_HEAD('Privacy') + `<body>
${PAGE_NAV}
<main>
  <span class="sp-eyebrow">Privacy</span>
  <h1>We store data.<br>We have to.</h1>
  <p class="sp-lede">Here's exactly what, for how long, and what it's used for. No dark patterns. No buried clauses.</p>
  <span class="sp-meta">Last updated: 5 May 2026</span>

  <ul class="sp-toc">
    <li><a href="#collect">01 — What we collect</a></li>
    <li><a href="#storage">02 — Where we store it</a></li>
    <li><a href="#retention">03 — How long</a></li>
    <li><a href="#never">04 — What we never touch</a></li>
    <li><a href="#aws">05 — AWS access</a></li>
    <li><a href="#rights">06 — Your rights</a></li>
    <li><a href="#contact">07 — Contact</a></li>
  </ul>

  <div class="sp-section" id="collect">
    <h2><span class="sp-num">01</span>What we collect</h2>
    <p><strong>Scan input:</strong> Your IAM Role ARN, ExternalId, and organization name. These are needed to perform the scan and label the report.</p>
    <p><strong>Evidence data:</strong> AWS API responses collected during the scan — IAM configuration, CloudTrail trail settings, S3 bucket metadata, VPC configuration, and similar infrastructure metadata. This is never your application data, customer data, or secret values. It is the AWS control plane describing how your account is configured.</p>
    <p><strong>Report content:</strong> The AI-generated analysis, findings, gap scores, and remediation recommendations derived from the evidence.</p>
    <p><strong>Edits:</strong> If you mark findings as resolved or edit finding text in the workspace, those edits are stored server-side so they persist across sessions.</p>
  </div>

  <div class="sp-section" id="storage">
    <h2><span class="sp-num">02</span>Where we store it</h2>
    <p>All data is stored in Cloudflare's infrastructure: Cloudflare D1 (SQLite database at the edge) for scan metadata, evidence, and report content; Cloudflare R2 (object storage) for pre-generated HTML and JSON report files.</p>
    <p>Cloudflare's data center locations are governed by their privacy terms. We do not have a separate data processing agreement to offer at this pilot stage. If that's a blocker for your organization, contact us before scanning.</p>
    <p>We do not use any third-party analytics platform, session replay tool, or advertising network. The only third party involved in processing a paid report is Stripe (payment processing) and Anthropic (Claude API for analysis).</p>
  </div>

  <div class="sp-section" id="retention">
    <h2><span class="sp-num">03</span>How long</h2>
    <table class="sp-retention-table">
      <thead><tr><th>Data type</th><th>Retention</th></tr></thead>
      <tbody>
        <tr><td>Raw evidence data</td><td>30 days from scan date, then automatic deletion</td></tr>
        <tr><td>Generated report (HTML + JSON)</td><td>30 days from generation, then automatic deletion</td></tr>
        <tr><td>Scan metadata (org name, ARN, scores)</td><td>30 days, then automatic deletion</td></tr>
        <tr><td>Finding edits / resolved marks</td><td>30 days, deleted with scan</td></tr>
        <tr><td>Payment records</td><td>As required by Stripe and tax regulations (typically 7 years)</td></tr>
      </tbody>
    </table>
    <p>You can request deletion before the 30-day window by emailing arjav@loxeai.com with your scan ID.</p>
  </div>

  <div class="sp-section" id="never">
    <h2><span class="sp-num">04</span>What we never touch</h2>
    <ul>
      <li>Application data — database contents, S3 object contents, file contents of any kind</li>
      <li>Customer data — anything your application stores about your users</li>
      <li>Secret values — Secrets Manager secret values, SSM Parameter Store values, environment variables</li>
      <li>Code — no repository access, no Lambda function code, no container images</li>
      <li>Financial data — billing records, cost data, payment methods</li>
    </ul>
    <p>The CloudFormation template we provide explicitly denies access to secret values and grants only read permissions on configuration metadata. You can inspect the template before deploying it.</p>
  </div>

  <div class="sp-section" id="aws">
    <h2><span class="sp-num">05</span>AWS access</h2>
    <p>Access is via STS AssumeRole with your ExternalId. Credentials are session-scoped (1 hour TTL) and never stored. The Worker assumes the role, runs the scan, and the session expires. There is no mechanism for us to access your account again without you providing a new ExternalId.</p>
    <p>The IAM role our CloudFormation deploys is scoped to SecurityAudit + ReadOnlyAccess managed policies, with an explicit Deny on any action that could access secret values. You can delete the role after receiving your report — it is not required to persist.</p>
    <p>All API calls use TLS 1.3. We sign requests with SigV4.</p>
  </div>

  <div class="sp-section" id="rights">
    <h2><span class="sp-num">06</span>Your rights</h2>
    <ul>
      <li><strong>Access:</strong> Email us with your scan ID and we'll provide a full export of your stored data.</li>
      <li><strong>Deletion:</strong> Email us with your scan ID for early deletion. Data auto-deletes at 30 days regardless.</li>
      <li><strong>Correction:</strong> If your org name or other metadata is wrong, we can correct it.</li>
      <li><strong>Portability:</strong> The JSON report package is a complete export of your scan data. Download it from the workspace.</li>
    </ul>
    <p>We do not sell data. We do not share data with third parties except Stripe (payment) and Anthropic (AI analysis), both of which are necessary to operate the service.</p>
  </div>

  <div class="sp-section" id="contact">
    <h2><span class="sp-num">07</span>Contact</h2>
    <p>Questions, deletion requests, or anything unclear: <a href="mailto:arjav@loxeai.com">arjav@loxeai.com</a>. Response within 48 hours on weekdays.</p>
  </div>

  <div class="sp-cta">Read the <a href="/methodology">methodology</a> for how evidence collection works and what we access.</div>
</main>
${PAGE_FOOT}`;
}

export function renderCookiesPage(): string {
  return PAGE_HEAD('Cookies') + `<body>
${PAGE_NAV}
<main>
  <span class="sp-eyebrow">Cookies</span>
  <h1>Cookies, briefly.</h1>
  <p class="sp-lede">We use the minimum cookies required to keep your session working. No analytics. No ad tech. No third-party trackers.</p>
  <span class="sp-meta">Last updated: 5 May 2026</span>

  <div class="sp-section">
    <h2><span class="sp-num">01</span>What we use</h2>
    <ul>
      <li><code>loxeai.token.[scanId]</code> — localStorage (not a cookie): holds your download token after purchase. Cleared when you clear browser storage.</li>
      <li><code>loxeai.external_id</code> — localStorage: persists your ExternalId so you don't regenerate it every visit.</li>
      <li><code>lxa_ck</code> — session preference cookie: remembers you dismissed the consent banner. 1-year expiry. No tracking data.</li>
    </ul>
    <p>That's it. We don't set any server-side session cookies.</p>
  </div>

  <div class="sp-section">
    <h2><span class="sp-num">02</span>What we don't use</h2>
    <ul>
      <li>No Google Analytics, Mixpanel, Amplitude, or PostHog</li>
      <li>No Facebook Pixel, LinkedIn Insight Tag, or Twitter conversion tracking</li>
      <li>No advertising network cookies of any kind</li>
      <li>No session replay tools (Hotjar, FullStory, etc.)</li>
      <li>No cross-site tracking</li>
    </ul>
  </div>

  <div class="sp-section">
    <h2><span class="sp-num">03</span>Your control</h2>
    <p>Clear localStorage and cookies in your browser at any time — the scan form will still work, you'll just need to re-enter your ExternalId and dismiss the banner again.</p>
    <p>Block cookies entirely in your browser — everything works except the banner preference won't persist.</p>
  </div>

  <div class="sp-cta">Questions: <a href="mailto:arjav@loxeai.com">arjav@loxeai.com</a></div>
</main>
${PAGE_FOOT}`;
}
