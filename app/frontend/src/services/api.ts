import type { IpcChannelName, IpcParams, IpcReturns } from '../../../electron/ipc/contract';

type ElectronAPI = {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export function ipc<C extends IpcChannelName>(
  channel: C,
  ...args: IpcParams<C>
): IpcReturns<C> {
  if (!window.electronAPI) {
    throw new Error('electronAPI not available — preload may have failed to load');
  }
  const fn = window.electronAPI[channel] as (...a: unknown[]) => unknown;
  return fn(...args) as IpcReturns<C>;
}
