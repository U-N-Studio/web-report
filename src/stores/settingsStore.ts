import { create } from 'zustand';

interface SettingsStore {
  settings: Record<string, unknown>;
  setSettings: (settings: Record<string, unknown>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: {},
  setSettings: (settings) => set({ settings }),
}));
