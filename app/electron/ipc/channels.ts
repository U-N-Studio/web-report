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
