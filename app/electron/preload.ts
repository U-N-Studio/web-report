import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannels, IpcChannelName, IpcParams, IpcReturns } from './ipc/contract';

type IpcBridge = {
  [C in IpcChannelName]: (...args: IpcParams<C>) => IpcReturns<C>;
};

const bridge: IpcBridge = Object.fromEntries(
  (Object.keys({} as IpcChannels) as IpcChannelName[]).map((channel) => [
    channel,
    (...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  ]),
) as IpcBridge;

contextBridge.exposeInMainWorld('electronAPI', bridge);
