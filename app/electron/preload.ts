import { contextBridge, ipcRenderer } from 'electron';
import { ipcHandlers } from './ipc/handlers';

const bridge = Object.fromEntries(
  Object.keys(ipcHandlers).map((channel) => [
    channel,
    (...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  ]),
);

contextBridge.exposeInMainWorld('electronAPI', bridge);
