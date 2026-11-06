import { ipcMain } from 'electron';
import { ipcHandlers } from './handlers';
import type { IpcChannelName } from '@shared/ipc';

export function registerAllIPC() {
  for (const channel of Object.keys(ipcHandlers) as IpcChannelName[]) {
    const handler = ipcHandlers[channel];
    ipcMain.handle(channel, async (_event, ...args) => {
      return handler(...args);
    });
  }
}
