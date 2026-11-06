import type { IpcChannelName } from './channels';
export type { IpcChannelName };
import * as reportService from '../services/report';
import type { AnalyzeResult, Video } from '../backend/types';
import type { ReportRow, ReportDetail } from '../database/types';

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
    returns: Promise<ReportRow[]>;
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
    returns: Promise<Record<string, string>>;
  };
  'save-settings': {
    params: [settings: Record<string, unknown>];
    returns: Promise<void>;
  };
}

export type IpcParams<C extends IpcChannelName> = IpcChannels[C]['params'];
export type IpcReturns<C extends IpcChannelName> = IpcChannels[C]['returns'];

export const ipcHandlers: {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
} = {
  'fetch-homepage': (platform) => reportService.fetchHomepage(platform),
  'search-and-analyze': (params) => reportService.searchVideos(params),
  'analyze-video': (params) => reportService.analyzeAndSaveReport(params),
  'get-reports': () => reportService.getReports(),
  'get-report-detail': (reportId) => reportService.getReportDetail(reportId),
  'update-comment-status': (commentId, isViolation) => reportService.updateCommentStatus(commentId, isViolation),
  'get-settings': () => reportService.getSettingsData(),
  'save-settings': (settings) => reportService.saveSettingsData(settings),
};
