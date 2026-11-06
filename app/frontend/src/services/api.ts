import type { IpcChannelName, IpcParams, IpcReturns } from '@shared/ipc';
import type { Video, Report, ReportDetail, Settings, AnalyzeResult } from '@shared/types';

type ElectronAPI = {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

function ipc<C extends IpcChannelName>(
  channel: C,
  ...args: IpcParams<C>
): IpcReturns<C> {
  if (!window.electronAPI) {
    throw new Error('electronAPI not available — preload may have failed to load');
  }
  const fn = window.electronAPI[channel] as (...a: unknown[]) => unknown;
  return fn(...args) as IpcReturns<C>;
}

export const fetchHomepage = (platform: string): Promise<Video[]> =>
  ipc('fetch-homepage', platform);

export const searchVideos = (platform: string, keyword: string, url?: string): Promise<Video[]> =>
  ipc('search-and-analyze', { platform, keyword, url });

export const analyzeVideo = (params: {
  platform: string;
  videoId: string;
  aiMode: string;
  modelName?: string;
  customRules?: string;
}): Promise<{ reportId: string } & AnalyzeResult> =>
  ipc('analyze-video', params);

export const getReports = (): Promise<Report[]> =>
  ipc('get-reports');

export const getReportDetail = (reportId: string): Promise<ReportDetail> =>
  ipc('get-report-detail', reportId);

export const updateCommentStatus = (commentId: string, isViolation: boolean): Promise<void> =>
  ipc('update-comment-status', commentId, isViolation);

export const getSettings = (): Promise<Settings> =>
  ipc('get-settings');

export const saveSettings = (settings: Record<string, unknown>): Promise<void> =>
  ipc('save-settings', settings);
