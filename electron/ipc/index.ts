import { registerReportIPC } from './report';
import { registerSettingsIPC } from './settings';

export function registerAllIPC() {
  registerReportIPC();
  registerSettingsIPC();
}
