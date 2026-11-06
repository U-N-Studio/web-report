export interface Video {
  id: string;
  title: string;
  url: string;
  author?: string;
  thumbnail?: string;
}

export interface AnalyzedComment {
  id: string;
  author?: string;
  content: string;
  original_url?: string;
  category?: string;
  is_violation: boolean;
  confidence: number;
  ai_reason?: string;
}

export interface AnalyzeResult {
  video: Video;
  comments: AnalyzedComment[];
  total: number;
  flagged: number;
}

export interface Report {
  id: string;
  platform: string;
  url: string;
  title?: string;
  keyword?: string;
  totalComments: number;
  flaggedComments: number;
  createdAt: string;
}

export interface ReportComment {
  id: string;
  author?: string;
  content: string;
  originalUrl?: string;
  category?: string;
  isViolation: boolean;
  confidence: number;
  aiReason?: string;
}

export interface ReportDetail extends Report {
  comments: ReportComment[];
}

export type Settings = Record<string, string>;
