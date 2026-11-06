import type { Video, AnalyzeResult, Report, ReportDetail, Settings } from './types';

export const IPC_CHANNELS = [
  'fetch-homepage',
  'search-and-analyze',
  'analyze-video',
  'get-reports',
  'get-report-detail',
  'update-comment-status',
  'get-settings',
  'save-settings',
] as const;

export type IpcChannelName = (typeof IPC_CHANNELS)[number];

export interface IpcChannels {
  'fetch-homepage': {
    params: [platform: string];
    returns: Promise<Video[]>;
  };
  'search-and-analyze': {
    params: [params: { platform: string; keyword: string; url?: string }];
    returns: Promise<Video[]>;
  };
  'analyze-video': {
    params: [params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }];
    returns: Promise<{ reportId: string } & AnalyzeResult>;
  };
  'get-reports': {
    params: [];
    returns: Promise<Report[]>;
  };
  'get-report-detail': {
    params: [reportId: string];
    returns: Promise<ReportDetail>;
  };
  'update-comment-status': {
    params: [commentId: string, isViolation: boolean];
    returns: Promise<void>;
  };
  'get-settings': {
    params: [];
    returns: Promise<Settings>;
  };
  'save-settings': {
    params: [settings: Record<string, unknown>];
    returns: Promise<void>;
  };
}

export type IpcParams<C extends IpcChannelName> = IpcChannels[C]['params'];
export type IpcReturns<C extends IpcChannelName> = IpcChannels[C]['returns'];
