export interface DailyRecord {
  date: string;
  day: number;
  dayOfWeek: number;
  careCountNeuro: number;
  careCountRehab: number;
  newPatientsNeuro: number;
  newPatientsRehab: number;
  newPatientsOther: number;
  newBeds: string[];
}

export interface StaffData {
  id: number;
  name: string;
  records: DailyRecord[];
  totalCare: number;
  totalCareNeuro: number;
  totalCareRehab: number;
  totalNew: number;
  workdays: number;
  careScore: string;
  newScore: string;
  totalScore: number;
  baseValue: number;
}

export type ViewType = 'entry-care' | 'entry-new' | 'dashboard';
export type DashViewMode = 'overview' | 'staff';
export type SyncStatus = 'syncing' | 'synced' | 'mismatch' | 'error' | 'offline';
