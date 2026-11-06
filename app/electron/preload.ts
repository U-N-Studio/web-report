import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './ipc/channels';

const bridge = Object.fromEntries(
  IPC_CHANNELS.map((channel) => [
    channel,
    (...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  ]),
);

contextBridge.exposeInMainWorld('electronAPI', bridge);
