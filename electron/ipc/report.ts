import { ipcMain } from 'electron';
import { v4 as uuid } from 'uuid';
import { createReport, insertComment, getAllReports, getReportById, updateCommentViolation } from '../database';
import { pythonFetch } from '../python-bridge';

export function registerReportIPC() {
  ipcMain.handle('fetch-homepage', async (_event, platform: string) => {
    const resp = await pythonFetch('/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, keyword: '' }),
    }) as { videos: { id: string; title: string; url: string; author?: string; thumbnail?: string }[] };
    return resp.videos;
  });

  ipcMain.handle('search-and-analyze', async (_event, params: { platform: string; keyword: string; url?: string }) => {
    const searchResp = await pythonFetch('/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }) as { videos: { id: string; title: string; url: string; author?: string }[] };

    return searchResp.videos;
  });

  ipcMain.handle('analyze-video', async (_event, params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }) => {
    const analyzeResp = await pythonFetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: params.platform,
        video_id: params.videoId,
        ai_mode: params.aiMode,
        model_name: params.modelName,
        custom_rules: params.customRules,
      }),
    }) as {
      video: { id: string; title: string; url: string };
      comments: { id: string; author?: string; content: string; original_url?: string; category?: string; is_violation: boolean; confidence: number; ai_reason?: string }[];
      total: number;
      flagged: number;
    };

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
  });

  ipcMain.handle('get-reports', async () => {
    return getAllReports();
  });

  ipcMain.handle('get-report-detail', async (_event, reportId: string) => {
    return getReportById(reportId);
  });

  ipcMain.handle('update-comment-status', async (_event, commentId: string, isViolation: boolean) => {
    updateCommentViolation(commentId, isViolation);
  });
}
