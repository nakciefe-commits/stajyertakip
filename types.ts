export enum RecordType {
  WORK = 'Giriş',
  LEAVE = 'Çıkış' // Or used for leave days in admin context
}

export interface PlanRecord {
  id?: string;
  date?: string;
  title?: string;
  description?: string;
}

export interface UserProfile {
  id: string; // Firestore Doc ID
  firstName: string;
  lastName: string;
  role: 'Stajyer' | 'Aday Mühendis';
  department: string;
  email?: string;
  phone?: string;
  avatarColor?: string;
  
  // Real-time status fields for cost optimization
  currentStatus?: 'Giriş' | 'Çıkış';
  lastSeen?: any; // Firestore Timestamp
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  fullName: string; // Denormalized for easier logs
  type: 'Giriş' | 'Çıkış' | string;
  timestamp: any; // Firestore Timestamp
  
  // Optional fields for analysis
  hours?: number;
  date?: string;
  description?: string;
}

// Helper for UI display
export interface UserStats {
  totalWorkDays: number;
  totalWorkHours: number; // This might be harder to calc with just raw logs without processing
  totalLeaveDays: number;
}