import { IBackendAPI, IProcessBridge } from './types';
import { HttpBackend } from './http-backend';
import { PythonProcessBridge, createPythonBridge } from './process-bridge';

export { IBackendAPI, IProcessBridge } from './types';
export { HttpBackend } from './http-backend';
export { PythonProcessBridge, createPythonBridge } from './process-bridge';

export interface BackendInstance {
  api: IBackendAPI;
  process?: IProcessBridge;
  start(): Promise<void>;
  stop(): void;
}

class ManagedBackend implements BackendInstance {
  api: IBackendAPI;
  process?: IProcessBridge;

  constructor(api: IBackendAPI, processBridge?: IProcessBridge) {
    this.api = api;
    this.process = processBridge;
  }

  async start(): Promise<void> {
    if (this.process) {
      await this.process.start();
    }
  }

  stop(): void {
    this.process?.stop();
  }
}

let currentBackend: BackendInstance | null = null;

export function createLocalPythonBackend(port = 8765): BackendInstance {
  const processBridge = createPythonBridge();
  const api = new HttpBackend(`http://127.0.0.1:${port}`);
  return new ManagedBackend(api, processBridge);
}

export function createHttpBackend(baseUrl: string): BackendInstance {
  const api = new HttpBackend(baseUrl);
  return new ManagedBackend(api);
}

export function createCustomBackend(api: IBackendAPI, processBridge?: IProcessBridge): BackendInstance {
  return new ManagedBackend(api, processBridge);
}

export function initBackend(backend: BackendInstance): void {
  currentBackend = backend;
}

export function getBackend(): BackendInstance {
  if (!currentBackend) {
    throw new Error('Backend not initialized. Call initBackend() first.');
  }
  return currentBackend;
}
