import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { MIGRATIONS } from './migrations';
import type { Report, ReportDetail, ReportComment, Settings } from '@shared/types';

interface ReportRow {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  keyword: string | null;
  total_comments: number;
  flagged_comments: number;
  created_at: string;
}

interface CommentRow {
  id: string;
  report_id: string;
  author: string | null;
  content: string;
  original_url: string | null;
  category: string | null;
  is_violation: number;
  confidence: number;
  ai_reason: string | null;
  created_at: string;
}

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

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    platform: row.platform,
    url: row.url,
    title: row.title ?? undefined,
    keyword: row.keyword ?? undefined,
    totalComments: row.total_comments,
    flaggedComments: row.flagged_comments,
    createdAt: row.created_at,
  };
}

function mapComment(row: CommentRow): ReportComment {
  return {
    id: row.id,
    author: row.author ?? undefined,
    content: row.content,
    originalUrl: row.original_url ?? undefined,
    category: row.category ?? undefined,
    isViolation: !!row.is_violation,
    confidence: row.confidence,
    aiReason: row.ai_reason ?? undefined,
  };
}

export function getAllReports(): Report[] {
  const d = getDatabase();
  const rows = d.prepare(`SELECT * FROM reports ORDER BY created_at DESC`).all() as ReportRow[];
  return rows.map(mapReport);
}

export function getReportById(id: string): ReportDetail {
  const d = getDatabase();
  const row = d.prepare(`SELECT * FROM reports WHERE id = ?`).get(id) as ReportRow;
  const commentRows = d.prepare(`SELECT * FROM comments WHERE report_id = ?`).all(id) as CommentRow[];
  return { ...mapReport(row), comments: commentRows.map(mapComment) };
}

export function updateCommentViolation(id: string, isViolation: boolean) {
  const d = getDatabase();
  d.prepare(`UPDATE comments SET is_violation = ? WHERE id = ?`).run(isViolation ? 1 : 0, id);
}

export function getSettings(): Settings {
  const d = getDatabase();
  const rows = d.prepare(`SELECT key, value FROM settings`).all() as { key: string; value: string }[];
  const result: Settings = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function saveSettings(settings: Record<string, unknown>) {
  const d = getDatabase();
  const upsert = d.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  const run = d.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, String(value));
    }
  });
  run();
}
