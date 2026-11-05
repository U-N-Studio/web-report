import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { MIGRATIONS } from './migrations';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'web-report.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations();
  }
  return db;
}

function runMigrations() {
  if (!db) return;
  const run = db.transaction(() => {
    for (const sql of MIGRATIONS) {
      db!.exec(sql);
    }
  });
  run();
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export function createReport(report: {
  id: string;
  platform: string;
  url: string;
  title?: string;
  keyword?: string;
  totalComments: number;
  flaggedComments: number;
}) {
  const d = getDatabase();
  d.prepare(
    `INSERT INTO reports (id, platform, url, title, keyword, total_comments, flagged_comments)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(report.id, report.platform, report.url, report.title ?? null, report.keyword ?? null, report.totalComments, report.flaggedComments);
  return report.id;
}

export function insertComment(comment: {
  id: string;
  reportId: string;
  author?: string;
  content: string;
  originalUrl?: string;
  category?: string;
  isViolation: boolean;
  confidence: number;
  aiReason?: string;
}) {
  const d = getDatabase();
  d.prepare(
    `INSERT INTO comments (id, report_id, author, content, original_url, category, is_violation, confidence, ai_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(comment.id, comment.reportId, comment.author ?? null, comment.content, comment.originalUrl ?? null, comment.category ?? null, comment.isViolation ? 1 : 0, comment.confidence, comment.aiReason ?? null);
}

export function getAllReports() {
  const d = getDatabase();
  return d.prepare(`SELECT * FROM reports ORDER BY created_at DESC`).all();
}

export function getReportById(id: string) {
  const d = getDatabase();
  const report = d.prepare(`SELECT * FROM reports WHERE id = ?`).get(id);
  const comments = d.prepare(`SELECT * FROM comments WHERE report_id = ?`).all(id);
  return { ...(report as object), comments };
}

export function updateCommentViolation(id: string, isViolation: boolean) {
  const d = getDatabase();
  d.prepare(`UPDATE comments SET is_violation = ? WHERE id = ?`).run(isViolation ? 1 : 0, id);
}

export function getSettings() {
  const d = getDatabase();
  d.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  const rows = d.prepare(`SELECT key, value FROM settings`).all();
  const result: Record<string, string> = {};
  for (const row of rows as { key: string; value: string }[]) {
    result[row.key] = row.value;
  }
  return result;
}

export function saveSettings(settings: Record<string, unknown>) {
  const d = getDatabase();
  d.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  const upsert = d.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  const run = d.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, JSON.stringify(value));
    }
  });
  run();
}
