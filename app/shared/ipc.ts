import type { ipcHandlers } from '../electron/ipc/handlers';

export type IpcHandlers = typeof ipcHandlers;
export type IpcChannelName = keyof IpcHandlers;
export type IpcParams<C extends IpcChannelName> = Parameters<IpcHandlers[C]>;
export type IpcReturns<C extends IpcChannelName> = ReturnType<IpcHandlers[C]>;

export type IpcService = {
  [C in IpcChannelName as KebabToCamel<C>]: (...args: IpcParams<C>) => IpcReturns<C>;
};

type KebabToCamel<S extends string> =
  S extends `${infer Head}-${infer Rest}`
    ? Rest extends `${infer First}${infer Tail}`
      ? `${Head}${Uppercase<First>}${KebabToCamel<Tail>}`
      : never
    : S;
