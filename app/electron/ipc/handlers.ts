import type { IpcChannelName, IpcParams, IpcReturns } from '@shared/ipc';
import * as reportService from '../services/report';

export const ipcHandlers: {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
} = {
  'fetch-homepage': (platform) => reportService.fetchHomepage(platform),
  'search-videos': (params) => reportService.searchVideos(params),
  'analyze-video': (params) => reportService.analyzeAndSaveReport(params),
  'get-reports': () => reportService.getReports(),
  'get-report-detail': (reportId) => reportService.getReportDetail(reportId),
  'update-comment-status': (commentId, isViolation) => reportService.updateCommentStatus(commentId, isViolation),
  'get-settings': () => reportService.getSettingsData(),
  'save-settings': (settings) => reportService.saveSettingsData(settings),
};
