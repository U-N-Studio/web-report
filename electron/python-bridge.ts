import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app } from 'electron';

let pythonProcess: ChildProcess | null = null;
let pythonPort = 8765;
let pythonReady = false;

function getPythonExecutable(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python', 'web-report-engine');
  }
  return 'python';
}

function getPythonCwd(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python');
  }
  return app.getAppPath();
}

export async function startPythonBackend(): Promise<number> {
  return new Promise((resolve, reject) => {
    const cwd = getPythonCwd();
    const isDev = !app.isPackaged;

    const args = isDev
      ? ['-m', 'uvicorn', 'python.main:app', '--port', String(pythonPort), '--host', '127.0.0.1']
      : [];

    pythonProcess = spawn(getPythonExecutable(), args, {
      cwd,
      env: { ...process.env, PYTHONPATH: cwd },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    pythonProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString();
      if (!pythonReady && msg.includes('Uvicorn running')) {
        pythonReady = true;
        resolve(pythonPort);
      }
    });

    pythonProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString();
      if (!pythonReady && msg.includes('Uvicorn running')) {
        pythonReady = true;
        resolve(pythonPort);
      }
    });

    pythonProcess.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      if (!pythonReady) {
        pythonReady = true;
        resolve(pythonPort);
      }
    }, 5000);
  });
}

export function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    pythonReady = false;
  }
}

export async function pythonFetch(endpoint: string, options?: RequestInit): Promise<unknown> {
  const url = `http://127.0.0.1:${pythonPort}${endpoint}`;
  const resp = await fetch(url, options);
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Python API error ${resp.status}: ${body}`);
  }
  return resp.json();
}
