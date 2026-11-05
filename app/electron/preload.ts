import { contextBridge, ipcRenderer } from 'electron';

const channels = [
  'fetch-homepage',
  'search-and-analyze',
  'analyze-video',
  'get-reports',
  'get-report-detail',
  'update-comment-status',
  'get-settings',
  'save-settings',
] as const;

const bridge = Object.fromEntries(
  channels.map((channel) => [
    channel,
    (...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  ]),
);

contextBridge.exposeInMainWorld('electronAPI', bridge);
