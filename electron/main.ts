import { app, BrowserWindow } from 'electron';
import path from 'path';
import { getDatabase, closeDatabase } from './database';
import { registerAllIPC } from './ipc';
import { startPythonBackend, stopPythonBackend } from './python-bridge';

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

app.whenReady().then(() => {
  registerAllIPC();
  getDatabase();
  createWindow();
  startPythonBackend().catch(() => {});
});

app.on('window-all-closed', () => {
  stopPythonBackend();
  closeDatabase();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
