export interface ReportRow {
  id: string;
  platform: string;
  url: string;
  title?: string;
  keyword?: string;
  total_comments: number;
  flagged_comments: number;
  created_at: string;
}

export interface CommentRow {
  id: string;
  report_id: string;
  author?: string;
  content: string;
  original_url?: string;
  category?: string;
  is_violation: number;
  confidence: number;
  ai_reason?: string;
  created_at: string;
}

export interface ReportDetail extends ReportRow {
  comments: CommentRow[];
}
