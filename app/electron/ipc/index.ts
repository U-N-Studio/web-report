import { ipcMain } from 'electron';
import { ipcHandlers } from './handlers';

export function registerAllIPC() {
  for (const [channel, handler] of Object.entries(ipcHandlers)) {
    ipcMain.handle(channel, async (_event, ...args) => {
      return (handler as (...a: unknown[]) => unknown)(...args);
    });
  }
}
