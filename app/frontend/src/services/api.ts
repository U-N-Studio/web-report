import type { IpcChannelName, IpcParams, IpcReturns } from '../../../electron/ipc/contract';

type ElectronAPI = {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

function getApi(): ElectronAPI {
  if (!window.electronAPI) {
    throw new Error('electronAPI not available — preload may have failed to load');
  }
  return window.electronAPI;
}

export const fetchHomepage = (platform: string) => getApi()['fetch-homepage'](platform);
export const searchVideos = (platform: string, keyword: string, url?: string) => getApi()['search-and-analyze']({ platform, keyword, url });
export const analyzeVideo = (params: IpcParams<'analyze-video'>[0]) => getApi()['analyze-video'](params);
export const getReports = () => getApi()['get-reports']();
export const getReportDetail = (reportId: string) => getApi()['get-report-detail'](reportId);
export const updateCommentStatus = (commentId: string, isViolation: boolean) => getApi()['update-comment-status'](commentId, isViolation);
export const getSettings = () => getApi()['get-settings']();
export const saveSettings = (settings: Record<string, unknown>) => getApi()['save-settings'](settings);
