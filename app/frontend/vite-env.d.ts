/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    searchAndAnalyze: (params: { platform: string; keyword: string; url?: string }) => Promise<unknown>;
    fetchHomepage: (platform: string) => Promise<unknown[]>;
    analyzeVideo: (params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }) => Promise<unknown>;
    getReports: () => Promise<unknown[]>;
    getReportDetail: (reportId: string) => Promise<unknown>;
    updateCommentStatus: (commentId: string, isViolation: boolean) => Promise<void>;
    getSettings: () => Promise<Record<string, unknown>>;
    saveSettings: (settings: Record<string, unknown>) => Promise<void>;
    onAnalysisProgress: (callback: (progress: unknown) => void) => void;
  };
}
