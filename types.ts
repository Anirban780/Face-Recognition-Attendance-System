export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

export interface Subject {
  code: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  assignedSubjects?: string[]; // Subject codes for Faculty
}

export interface Student {
  id: string;
  enrollmentNo: string;
  name: string;
  email: string;
  semester: number;
  branch: string;
  status: 'Active' | 'Inactive';
  photoCount: number;
  enrolledSubjects: string[]; // Subject codes
}

export interface AttendanceSession {
  id: string;
  subject: string;
  subjectCode: string;
  facultyName: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  totalPresent: number;
  totalStudents: number;
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  enrollmentNo: string;
  subject: string;
  date: string;
  time: string;
  status: 'Present' | 'Absent';
}

export interface DashboardStats {
  totalStudents: number;
  activeSessions: number;
  averageAttendance: number;
  pendingApprovals: number;
}