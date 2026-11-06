import { ipcHandlers } from '../electron/ipc/handlers';
import { IPC_CHANNELS, type IpcChannelName } from '../shared/ipc';

const declaredChannels = new Set<string>(IPC_CHANNELS);
const implementedChannels = new Set<string>(Object.keys(ipcHandlers));

const missingInHandlers = [...declaredChannels].filter((c) => !implementedChannels.has(c));
const missingInContract = [...implementedChannels].filter((c) => !declaredChannels.has(c));

if (missingInHandlers.length > 0) {
  console.error(`[check-ipc] Channels declared in shared/ipc.ts but missing in handlers.ts:`);
  for (const c of missingInHandlers) console.error(`  - ${c}`);
}
if (missingInContract.length > 0) {
  console.error(`[check-ipc] Channels implemented in handlers.ts but missing in shared/ipc.ts:`);
  for (const c of missingInContract) console.error(`  - ${c}`);
}

if (missingInHandlers.length > 0 || missingInContract.length > 0) {
  process.exit(1);
}

console.log(`[check-ipc] OK — ${declaredChannels.size} channels in sync`);
