const api = window.electronAPI;

export async function searchVideos(platform: string, keyword: string) {
  return api.searchAndAnalyze({ platform, keyword });
}

export async function fetchHomepage(platform: string) {
  return api.fetchHomepage(platform);
}

export async function analyzeVideo(params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }) {
  return api.analyzeVideo(params);
}

export async function getReports() {
  return api.getReports();
}

export async function getReportDetail(reportId: string) {
  return api.getReportDetail(reportId);
}

export async function updateCommentStatus(commentId: string, isViolation: boolean) {
  return api.updateCommentStatus(commentId, isViolation);
}

export async function getSettings() {
  return api.getSettings();
}

export async function saveSettings(settings: Record<string, unknown>) {
  return api.saveSettings(settings);
}
