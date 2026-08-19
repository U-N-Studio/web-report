import { create } from 'zustand';

interface ReportStore {
  reports: unknown[];
  currentReport: unknown | null;
  loading: boolean;
  setReports: (reports: unknown[]) => void;
  setCurrentReport: (report: unknown | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  currentReport: null,
  loading: false,
  setReports: (reports) => set({ reports }),
  setCurrentReport: (currentReport) => set({ currentReport }),
  setLoading: (loading) => set({ loading }),
}));
