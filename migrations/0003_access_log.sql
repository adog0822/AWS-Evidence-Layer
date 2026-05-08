-- Audit log: tracks every access to scan data
CREATE TABLE IF NOT EXISTS scan_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id TEXT NOT NULL,
  action TEXT NOT NULL,       -- 'view_results' | 'view_status' | 'download_report' | 'gideon_query' | 'delete_scan'
  actor TEXT NOT NULL,        -- 'owner' | 'token_holder' | 'anonymous'
  ip_hash TEXT,               -- SHA-256 of IP, not raw IP
  created_at INTEGER NOT NULL,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE INDEX IF NOT EXISTS idx_access_log_scan ON scan_access_log(scan_id);
CREATE INDEX IF NOT EXISTS idx_access_log_time ON scan_access_log(created_at);
