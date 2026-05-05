-- LoxeAI Pilot v2 — migration 0002
-- Adds: scan_ai_progress, scan_ai_controls (queue-based analysis), gideon_messages (conversation history)

CREATE TABLE IF NOT EXISTS scan_ai_progress (
  scan_id TEXT PRIMARY KEY,
  total_controls INTEGER NOT NULL,
  completed_controls INTEGER NOT NULL DEFAULT 0,
  download_token TEXT,
  completed_at INTEGER,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS scan_ai_controls (
  scan_id TEXT NOT NULL,
  control_id TEXT NOT NULL,
  result_json TEXT NOT NULL,
  analyzed_at INTEGER NOT NULL,
  PRIMARY KEY (scan_id, control_id),
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS gideon_messages (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE INDEX IF NOT EXISTS idx_scan_ai_controls_scan ON scan_ai_controls(scan_id);
CREATE INDEX IF NOT EXISTS idx_gideon_messages_scan ON gideon_messages(scan_id, created_at);
