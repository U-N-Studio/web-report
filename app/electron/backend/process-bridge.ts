import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app } from 'electron';
import { IProcessBridge } from './types';

export class PythonProcessBridge implements IProcessBridge {
  private process: ChildProcess | null = null;
  private port: number;
  private ready = false;
  private readyPattern: string;
  private executable: string | (() => string);
  private args: string[] | (() => string[]);
  private cwd: string | (() => string);
  private envExtra: Record<string, string> | (() => Record<string, string>);

  constructor(opts: {
    port?: number;
    readyPattern?: string;
    executable: string | (() => string);
    args: string[] | (() => string[]);
    cwd: string | (() => string);
    envExtra?: Record<string, string> | (() => Record<string, string>);
  }) {
    this.port = opts.port ?? 8765;
    this.readyPattern = opts.readyPattern ?? 'Application startup complete';
    this.executable = opts.executable;
    this.args = opts.args;
    this.cwd = opts.cwd;
    this.envExtra = opts.envExtra ?? {};
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      const exe = typeof this.executable === 'function' ? this.executable() : this.executable;
      const args = typeof this.args === 'function' ? this.args() : this.args;
      const cwd = typeof this.cwd === 'function' ? this.cwd() : this.cwd;
      const extra = typeof this.envExtra === 'function' ? this.envExtra() : this.envExtra;

      this.process = spawn(exe, args, {
        cwd,
        env: { ...process.env, ...extra },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        if (!this.ready) {
          this.process?.kill();
          this.process = null;
          reject(new Error(`Backend failed to start within 5 seconds`));
        }
      }, 5000);

      const checkReady = (data: Buffer) => {
        if (!this.ready && data.toString().includes(this.readyPattern)) {
          this.ready = true;
          clearTimeout(timer);
          resolve(this.port);
        }
      };

      this.process.stdout?.on('data', checkReady);
      this.process.stderr?.on('data', checkReady);
      this.process.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.process.on('exit', (code) => {
        clearTimeout(timer);
        if (!this.ready) {
          reject(new Error(`Backend process exited with code ${code} before becoming ready`));
        }
      });
    });
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.ready = false;
    }
  }

  isRunning(): boolean {
    return this.ready && this.process !== null;
  }

  getPort(): number {
    return this.port;
  }
}

export function createPythonBridge(): PythonProcessBridge {
  return new PythonProcessBridge({
    executable: () => app.isPackaged
      ? path.join(process.resourcesPath, 'python', 'web-report-engine')
      : 'python',
    args: () => app.isPackaged
      ? []
      : ['-m', 'uvicorn', 'backend.main:app', '--port', '8765', '--host', '127.0.0.1'],
    cwd: () => app.isPackaged
      ? path.join(process.resourcesPath, 'python')
      : app.getAppPath(),
    envExtra: () => ({ PYTHONPATH: app.isPackaged ? path.join(process.resourcesPath, 'python') : app.getAppPath() }),
  });
}
