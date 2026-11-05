import type { IpcChannels, IpcChannelName, IpcParams, IpcReturns } from '../../electron/ipc/contract';

type ElectronAPI = {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
};

const api = window.electronAPI as ElectronAPI;

export const fetchHomepage = (platform: string) => api['fetch-homepage'](platform);
export const searchVideos = (platform: string, keyword: string, url?: string) => api['search-and-analyze']({ platform, keyword, url });
export const analyzeVideo = (params: IpcParams<'analyze-video'>[0]) => api['analyze-video'](params);
export const getReports = () => api['get-reports']();
export const getReportDetail = (reportId: string) => api['get-report-detail'](reportId);
export const updateCommentStatus = (commentId: string, isViolation: boolean) => api['update-comment-status'](commentId, isViolation);
export const getSettings = () => api['get-settings']();
export const saveSettings = (settings: Record<string, unknown>) => api['save-settings'](settings);
