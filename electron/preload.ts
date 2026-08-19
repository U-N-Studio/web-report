import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  searchAndAnalyze: (params: { platform: string; keyword: string; url?: string }) =>
    ipcRenderer.invoke('search-and-analyze', params),
  fetchHomepage: (platform: string) =>
    ipcRenderer.invoke('fetch-homepage', platform),
  analyzeVideo: (params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }) =>
    ipcRenderer.invoke('analyze-video', params),
  getReports: () => ipcRenderer.invoke('get-reports'),
  getReportDetail: (reportId: string) => ipcRenderer.invoke('get-report-detail', reportId),
  updateCommentStatus: (commentId: string, isViolation: boolean) =>
    ipcRenderer.invoke('update-comment-status', commentId, isViolation),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('save-settings', settings),
  onAnalysisProgress: (callback: (progress: unknown) => void) => {
    ipcRenderer.on('analysis-progress', (_event, data) => callback(data));
  },
});
