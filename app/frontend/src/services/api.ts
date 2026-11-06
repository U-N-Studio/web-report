import type { IpcService, IpcChannelName, IpcParams, IpcReturns } from '@shared/ipc';

type ElectronAPI = {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const camelToKebab = (s: string) => s.replace(/([A-Z])/g, '-$1').toLowerCase();

const proxy: IpcService = new Proxy({} as IpcService, {
  get(_target, prop: string) {
    return (...args: unknown[]) => {
      if (!window.electronAPI) {
        throw new Error('electronAPI not available — preload may have failed to load');
      }
      const channel = camelToKebab(prop);
      const fn = (window.electronAPI as Record<string, (...a: unknown[]) => unknown>)[channel];
      if (!fn) throw new Error(`Unknown IPC channel: ${channel}`);
      return fn(...args);
    };
  },
});

export default proxy;
