export interface Video {
  id: string;
  title: string;
  url: string;
  author?: string;
  thumbnail?: string;
}

export interface Comment {
  id: string;
  author?: string;
  content: string;
  original_url?: string;
}

export interface AnalyzedComment extends Comment {
  category?: string;
  is_violation: boolean;
  confidence: number;
  ai_reason?: string;
}

export interface SearchParams {
  platform: string;
  keyword: string;
  url?: string;
}

export interface AnalyzeParams {
  platform: string;
  video_id: string;
  ai_mode: string;
  model_name?: string;
  custom_rules?: string;
}

export interface AnalyzeResult {
  video: Video;
  comments: AnalyzedComment[];
  total: number;
  flagged: number;
}

export interface BackendConfig {
  [key: string]: unknown;
}

export interface IBackendAPI {
  health(): Promise<{ status: string }>;

  fetchHomepage(platform: string): Promise<Video[]>;

  search(params: SearchParams): Promise<Video[]>;

  analyze(params: AnalyzeParams): Promise<AnalyzeResult>;

  updateConfig(config: BackendConfig): Promise<BackendConfig>;
}

export interface IProcessBridge {
  start(): Promise<number>;
  stop(): void;
  isRunning(): boolean;
}
