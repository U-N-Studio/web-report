import { v4 as uuid } from 'uuid';
import { createReport, insertComment, getAllReports, getReportById, updateCommentViolation, getSettings, saveSettings } from '../database';
import { getBackend } from '../backend';
import { AnalyzeResult } from '../backend/types';

export interface IpcChannels {
  'fetch-homepage': {
    params: [platform: string];
    returns: Promise<{ id: string; title: string; url: string; author?: string; thumbnail?: string }[]>;
  };
  'search-and-analyze': {
    params: [params: { platform: string; keyword: string; url?: string }];
    returns: Promise<{ id: string; title: string; url: string; author?: string }[]>;
  };
  'analyze-video': {
    params: [params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }];
    returns: Promise<{ reportId: string } & AnalyzeResult>;
  };
  'get-reports': {
    params: [];
    returns: Promise<unknown[]>;
  };
  'get-report-detail': {
    params: [reportId: string];
    returns: Promise<unknown>;
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

export type IpcChannelName = keyof IpcChannels;
export type IpcParams<C extends IpcChannelName> = IpcChannels[C]['params'];
export type IpcReturns<C extends IpcChannelName> = IpcChannels[C]['returns'];

export const ipcHandlers: {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
} = {
  'fetch-homepage': async (platform) => {
    return getBackend().api.fetchHomepage(platform);
  },

  'search-and-analyze': async (params) => {
    return getBackend().api.search(params);
  },

  'analyze-video': async (params) => {
    const analyzeResp = await getBackend().api.analyze({
      platform: params.platform,
      video_id: params.videoId,
      ai_mode: params.aiMode,
      model_name: params.modelName,
      custom_rules: params.customRules,
    });

    const reportId = uuid();
    createReport({
      id: reportId,
      platform: params.platform,
      url: analyzeResp.video?.url ?? '',
      title: analyzeResp.video?.title,
      keyword: '',
      totalComments: analyzeResp.total,
      flaggedComments: analyzeResp.flagged,
    });

    for (const c of analyzeResp.comments) {
      insertComment({
        id: c.id || uuid(),
        reportId,
        author: c.author,
        content: c.content,
        originalUrl: c.original_url,
        category: c.category,
        isViolation: c.is_violation,
        confidence: c.confidence,
        aiReason: c.ai_reason,
      });
    }

    return { reportId, ...analyzeResp };
  },

  'get-reports': async () => {
    return getAllReports();
  },

  'get-report-detail': async (reportId) => {
    return getReportById(reportId);
  },

  'update-comment-status': async (commentId, isViolation) => {
    updateCommentViolation(commentId, isViolation);
  },

  'get-settings': async () => {
    return getSettings();
  },

  'save-settings': async (settings) => {
    saveSettings(settings);
    await getBackend().api.updateConfig(settings);
  },
};
