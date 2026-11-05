import { app, BrowserWindow } from 'electron';
import path from 'path';
import { getDatabase, closeDatabase, getSettings } from './database';
import { registerAllIPC } from './ipc';
import { initBackend, createLocalPythonBackend, getBackend } from './backend';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Web Report',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  initBackend(createLocalPythonBackend());
  registerAllIPC();
  getDatabase();

  try {
    await getBackend().start();
    const settings = getSettings();
    if (Object.keys(settings).length > 0) {
      await getBackend().api.updateConfig(settings);
    }
  } catch (e) {
    console.error('Backend startup failed:', e);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  getBackend().stop();
  closeDatabase();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
