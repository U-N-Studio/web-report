import { ipcMain } from 'electron';
import { ipcHandlers, IpcChannelName } from './contract';

export function registerAllIPC() {
  for (const channel of Object.keys(ipcHandlers) as IpcChannelName[]) {
    const handler = ipcHandlers[channel];
    ipcMain.handle(channel, async (_event, ...args) => {
      return handler(...args);
    });
  }
}
