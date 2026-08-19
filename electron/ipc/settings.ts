import { ipcMain } from 'electron';
import { getSettings, saveSettings } from '../database';
import { pythonFetch } from '../python-bridge';

export function registerSettingsIPC() {
  ipcMain.handle('get-settings', async () => {
    return getSettings();
  });

  ipcMain.handle('save-settings', async (_event, settings: Record<string, unknown>) => {
    saveSettings(settings);
    await pythonFetch('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  });
}
