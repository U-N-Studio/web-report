export const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    keyword TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_comments INTEGER DEFAULT 0,
    flagged_comments INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id),
    author TEXT,
    content TEXT NOT NULL,
    original_url TEXT,
    category TEXT,
    is_violation BOOLEAN DEFAULT FALSE,
    confidence REAL DEFAULT 0.0,
    ai_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS report_actions (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES comments(id),
    action_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];
