export enum RecordType {
  WORK = 'Çalışma',
  LEAVE = 'İzin'
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'Stajyer' | 'Aday Mühendis';
  department: string;
  avatarColor?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string; // Linked to UserProfile
  date: string; // ISO string YYYY-MM-DD
  hours: number;
  type: RecordType;
  description: string;
}

export interface PlanRecord {
  id: string;
  userId: string; // Linked to UserProfile
  date: string;
  expectedHours: number;
  notes: string;
}

export interface UserStats {
  totalWorkDays: number;
  totalWorkHours: number;
  totalLeaveDays: number;
}