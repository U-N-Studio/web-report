import type { Video, AnalyzeResult, Report, ReportDetail, Settings } from './types';
export type { Settings } from './types';
export const IPC_CHANNELS = [
  'fetch-homepage',
  'search-videos',
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
    handler: 'reportService.fetchHomepage';
  };
  'search-videos': {
    params: [params: { platform: string; keyword: string; url?: string }];
    returns: Promise<Video[]>;
    handler: 'reportService.searchVideos';
  };
  'analyze-video': {
    params: [params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }];
    returns: Promise<{ reportId: string } & AnalyzeResult>;
    handler: 'reportService.analyzeAndSaveReport';
  };
  'get-reports': {
    params: [];
    returns: Promise<Report[]>;
    handler: 'reportService.getReports';
  };
  'get-report-detail': {
    params: [reportId: string];
    returns: Promise<ReportDetail>;
    handler: 'reportService.getReportDetail';
  };
  'update-comment-status': {
    params: [commentId: string, isViolation: boolean];
    returns: Promise<void>;
    handler: 'reportService.updateCommentStatus';
  };
  'get-settings': {
    params: [];
    returns: Promise<Settings>;
    handler: 'reportService.getSettingsData';
  };
  'save-settings': {
    params: [settings: Settings];
    returns: Promise<void>;
    handler: 'reportService.saveSettingsData';
  };
}

export type IpcParams<C extends IpcChannelName> = IpcChannels[C]['params'];
export type IpcReturns<C extends IpcChannelName> = IpcChannels[C]['returns'];
export type IpcHandler<C extends IpcChannelName> = IpcChannels[C]['handler'];

export type IpcService = {
  [C in IpcChannelName as KebabToCamel<C>]: (...args: IpcParams<C>) => IpcReturns<C>;
};

type KebabToCamel<S extends string> =
  S extends `${infer Head}-${infer Rest}`
    ? Rest extends `${infer First}${infer Tail}`
      ? `${Head}${Uppercase<First>}${KebabToCamel<Tail>}`
      : never
    : S;
