-- LoxeAI Pilot v2 — initial schema
-- Tables: scans, scan_results, scan_edits, report_purchases, scan_meter

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  org_name TEXT NOT NULL,
  aws_account_id TEXT,
  role_arn TEXT NOT NULL,
  external_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | scanning | analyzing | complete | error
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  evidence_count INTEGER DEFAULT 0,
  services_scanned TEXT, -- JSON array
  regions_scanned TEXT,  -- JSON array
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS scan_results (
  scan_id TEXT PRIMARY KEY,
  controls_json TEXT NOT NULL,     -- full controls array
  evidence_json TEXT NOT NULL,     -- evidence items array
  executive_summary TEXT,
  overall_readiness TEXT,
  overall_gap_score INTEGER,
  overall_freshness_score INTEGER,
  critical_actions_json TEXT,
  strengths_json TEXT,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS scan_edits (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  edit_type TEXT NOT NULL, -- 'severity_override' | 'note' | 'redaction'
  target_path TEXT NOT NULL, -- e.g. "controls.CC6.1.findings.0.severity"
  original_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS report_purchases (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 2999,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | refunded
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  download_token TEXT UNIQUE,
  download_count INTEGER DEFAULT 0,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS scan_meter (
  external_id TEXT PRIMARY KEY,
  scan_count INTEGER DEFAULT 0,
  last_scan_at INTEGER,
  daily_count INTEGER DEFAULT 0,
  daily_reset_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_scans_external_id ON scans(external_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_report_purchases_scan ON report_purchases(scan_id);
CREATE INDEX IF NOT EXISTS idx_report_purchases_token ON report_purchases(download_token);
CREATE INDEX IF NOT EXISTS idx_scan_edits_scan ON scan_edits(scan_id);
