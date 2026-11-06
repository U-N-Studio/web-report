import * as reportService from '../services/report';
import type { Video, AnalyzeResult, Report, ReportDetail, Settings } from '@shared/types';

export const ipcHandlers = {
  'fetch-homepage': (platform: string): Promise<Video[]> => reportService.fetchHomepage(platform),
  'search-videos': (params: { platform: string; keyword: string; url?: string }): Promise<Video[]> => reportService.searchVideos(params),
  'analyze-video': (params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }): Promise<{ reportId: string } & AnalyzeResult> => reportService.analyzeAndSaveReport(params),
  'get-reports': (): Promise<Report[]> => reportService.getReports(),
  'get-report-detail': (reportId: string): Promise<ReportDetail> => reportService.getReportDetail(reportId),
  'update-comment-status': (commentId: string, isViolation: boolean): Promise<void> => reportService.updateCommentStatus(commentId, isViolation),
  'get-settings': (): Promise<Settings> => reportService.getSettingsData(),
  'save-settings': (settings: Record<string, unknown>): Promise<void> => reportService.saveSettingsData(settings),
};
