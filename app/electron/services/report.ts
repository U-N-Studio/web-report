import { v4 as uuid } from 'uuid';
import { createReport, insertComment, getAllReports, getReportById, updateCommentViolation, getSettings, saveSettings } from '../database';
import { getBackend } from '../backend';
import type { AnalyzeResult, Video } from '@shared/types';
import type { Report, ReportDetail, Settings } from '@shared/types';

export async function fetchHomepage(platform: string): Promise<Video[]> {
  return getBackend().api.fetchHomepage(platform);
}

export async function searchVideos(params: { platform: string; keyword: string; url?: string }): Promise<Video[]> {
  return getBackend().api.search(params);
}

export async function analyzeAndSaveReport(params: {
  platform: string;
  videoId: string;
  aiMode: string;
  modelName?: string;
  customRules?: string;
}): Promise<{ reportId: string } & AnalyzeResult> {
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
}

export async function getReports(): Promise<Report[]> {
  return getAllReports();
}

export async function getReportDetail(reportId: string): Promise<ReportDetail> {
  return getReportById(reportId);
}

export async function updateCommentStatus(commentId: string, isViolation: boolean) {
  updateCommentViolation(commentId, isViolation);
}

export async function getSettingsData(): Promise<Settings> {
  return getSettings();
}

export async function saveSettingsData(settings: Record<string, unknown>) {
  saveSettings(settings);
  await getBackend().api.updateConfig(settings);
}
