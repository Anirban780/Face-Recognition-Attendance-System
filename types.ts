export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For mock auth
  enrollmentNo?: string; // For students/faculty
  role: UserRole;
  avatar?: string;
  semester?: number; // Only for students
  subjectIds?: string[]; // IDs of subjects assigned to student or faculty
}

export interface Subject {
  id: string;
  code: string;
  name: string;
}

export interface ClassSession {
  id: string;
  subjectId: string;
  facultyId: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  timestamp: string;
  verified: boolean;
}

export interface MockFaceData {
  studentId: string;
  imageCount: number;
}