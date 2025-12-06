import { UserRole, Student, AttendanceSession, AttendanceRecord, User, Subject } from '../types';
import axios from 'axios';

// --- CONFIGURATION ---
// Set to TRUE to run without a Python backend.
const USE_MOCK_API = true; 
const API_BASE_URL = 'http://127.0.0.1:5000/api';

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- MOCK DATA ---
export const SUBJECTS: Subject[] = [
  { code: 'CS301', name: 'Data Structures' },
  { code: 'CS302', name: 'Operating Systems' },
  { code: 'CS401', name: 'Computer Networks' },
  { code: 'CS501', name: 'Artificial Intelligence' },
  { code: 'EE201', name: 'Digital Circuits' },
];

const MOCK_STUDENTS: Student[] = [
  { id: '1', enrollmentNo: 'CS2023001', name: 'John Doe', email: 'john@test.com', semester: 5, branch: 'CSE', status: 'Active', photoCount: 5, enrolledSubjects: ['CS301', 'CS302'] },
  { id: '2', enrollmentNo: 'CS2023002', name: 'Jane Smith', email: 'jane@test.com', semester: 5, branch: 'CSE', status: 'Active', photoCount: 8, enrolledSubjects: ['CS301', 'CS401'] },
  { id: '3', enrollmentNo: 'CS2023003', name: 'Mike Ross', email: 'mike@test.com', semester: 3, branch: 'ECE', status: 'Active', photoCount: 0, enrolledSubjects: ['EE201'] },
  { id: '4', enrollmentNo: 'CS2023004', name: 'Sarah Connor', email: 'sarah@test.com', semester: 5, branch: 'CSE', status: 'Active', photoCount: 12, enrolledSubjects: ['CS301', 'CS501'] },
];

const MOCK_SESSIONS: AttendanceSession[] = [
  { id: '101', subject: 'Data Structures', subjectCode: 'CS301', facultyName: 'Dr. Alan Turing', date: '2023-10-25', startTime: '10:00', endTime: '11:00', isActive: true, totalPresent: 45, totalStudents: 60 },
  { id: '102', subject: 'Operating Systems', subjectCode: 'CS302', facultyName: 'Dr. Grace Hopper', date: '2023-10-24', startTime: '14:00', endTime: '15:00', isActive: false, totalPresent: 50, totalStudents: 60 },
];

const MOCK_HISTORY: AttendanceRecord[] = [
  { id: '1', studentName: 'John Doe', enrollmentNo: 'CS2023001', subject: 'Data Structures', date: '2023-10-25', time: '10:05 AM', status: 'Present' },
  { id: '2', studentName: 'John Doe', enrollmentNo: 'CS2023001', subject: 'Operating Systems', date: '2023-10-24', time: '02:00 PM', status: 'Absent' },
];

const MOCK_FACULTY: User[] = [
    { id: 'f1', name: 'Dr. Alan Turing', email: 'alan@college.edu', role: UserRole.FACULTY, assignedSubjects: ['CS301', 'CS501'] },
    { id: 'f2', name: 'Dr. Grace Hopper', email: 'grace@college.edu', role: UserRole.FACULTY, assignedSubjects: ['CS302', 'CS401'] }
];

export const api = {
  login: async (username: string): Promise<User> => {
    if (USE_MOCK_API) {
        await new Promise(r => setTimeout(r, 800)); // Simulate network delay
        
        const lowerUser = username.toLowerCase();
        
        if (lowerUser.includes('admin')) {
            return { id: '1', name: 'Admin User', email: 'admin@test.com', role: UserRole.ADMIN };
        }
        if (lowerUser.includes('faculty')) {
            return { id: '2', name: 'Dr. Faculty', email: 'faculty@test.com', role: UserRole.FACULTY, assignedSubjects: ['CS301', 'CS302'] };
        }
        if (lowerUser.includes('student')) {
            return { id: '3', name: 'John Student', email: 'student@test.com', role: UserRole.STUDENT };
        }
        
        // Default fallback for demo
        return { id: '3', name: 'John Student', email: 'student@test.com', role: UserRole.STUDENT };
    }
    const res = await apiInstance.post('/login', { username });
    return res.data;
  },

  getSubjects: async (): Promise<Subject[]> => {
    if (USE_MOCK_API) return SUBJECTS;
    const res = await apiInstance.get('/subjects');
    return res.data;
  },
  
  createSubject: async (code: string, name: string): Promise<Subject> => {
     if (USE_MOCK_API) {
         await new Promise(r => setTimeout(r, 500));
         const newSub = { code, name };
         SUBJECTS.push(newSub);
         return newSub;
     }
     const res = await apiInstance.post('/subjects', { code, name });
     return res.data;
  },

  getStudents: async (): Promise<Student[]> => {
    if (USE_MOCK_API) return MOCK_STUDENTS; 
    const res = await apiInstance.get('/students');
    return res.data;
  },

  getStudentsBySubject: async (subjectCode: string): Promise<Student[]> => {
    if (USE_MOCK_API) {
        return MOCK_STUDENTS.filter(s => s.enrolledSubjects.includes(subjectCode));
    }
    const res = await apiInstance.get('/students'); 
    return res.data.filter((s: Student) => s.enrolledSubjects.includes(subjectCode));
  },

  addStudent: async (student: any): Promise<Student> => {
    if (USE_MOCK_API) {
        await new Promise(r => setTimeout(r, 600));
        const newStudent = { ...student, id: Math.random().toString(), photoCount: 0, status: 'Active' };
        MOCK_STUDENTS.push(newStudent);
        return newStudent;
    }
    const res = await apiInstance.post('/students', student);
    return res.data;
  },
  
  uploadStudentImage: async (studentId: string, imageBase64: string): Promise<void> => {
      if (USE_MOCK_API) {
          // Fast upload simulation
          await new Promise(r => setTimeout(r, 200));
          const s = MOCK_STUDENTS.find(s => s.id === studentId);
          if (s) s.photoCount += 1;
          return;
      }
      await apiInstance.post(`/students/${studentId}/images`, { image: imageBase64 });
  },
  
  trainModel: async (): Promise<{message: string}> => {
      if (USE_MOCK_API) {
          // This delay is handled by the UI progress bar, but we add a small one here
          await new Promise(r => setTimeout(r, 1000));
          return { message: "Training Complete" };
      }
      const res = await apiInstance.post('/train');
      return res.data;
  },

  getFaculties: async (): Promise<User[]> => {
    if (USE_MOCK_API) return MOCK_FACULTY;
    const res = await apiInstance.get('/faculties');
    return res.data;
  },

  addFaculty: async (facultyData: any): Promise<User> => {
    if (USE_MOCK_API) {
        await new Promise(r => setTimeout(r, 500));
        const newFac = { ...facultyData, id: Math.random().toString(), role: UserRole.FACULTY };
        MOCK_FACULTY.push(newFac);
        return newFac;
    }
    const res = await apiInstance.post('/faculties', facultyData);
    return res.data;
  },

  getSessions: async (): Promise<AttendanceSession[]> => {
    if (USE_MOCK_API) return MOCK_SESSIONS;
    const res = await apiInstance.get('/sessions');
    return res.data;
  },

  createSession: async (subjectCode: string): Promise<AttendanceSession> => {
    if (USE_MOCK_API) {
        await new Promise(r => setTimeout(r, 500));
        const newSession: AttendanceSession = {
            id: Math.random().toString(),
            subject: SUBJECTS.find(s => s.code === subjectCode)?.name || 'Unknown',
            subjectCode,
            facultyName: 'Dr. Faculty',
            date: new Date().toISOString().split('T')[0],
            startTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            endTime: '...',
            isActive: true,
            totalPresent: 0,
            totalStudents: MOCK_STUDENTS.filter(s => s.enrolledSubjects.includes(subjectCode)).length
        };
        MOCK_SESSIONS.unshift(newSession);
        return newSession;
    }
    const res = await apiInstance.post('/sessions', { subjectCode });
    return res.data;
  },

  getAttendanceHistory: async (enrollmentNo?: string): Promise<AttendanceRecord[]> => {
    if (USE_MOCK_API) return MOCK_HISTORY;
    const res = await apiInstance.get(`/attendance/history?enrollmentNo=${enrollmentNo}`);
    return res.data;
  },

  getAttendanceBySession: async (subject: string, date: string): Promise<AttendanceRecord[]> => {
    if (USE_MOCK_API) return [];
    const res = await apiInstance.get(`/attendance/session?subject=${subject}&date=${date}`);
    return res.data;
  },

  markAttendance: async (image: string, sessionId: string): Promise<{ success: boolean; student?: string; message?: string }> => {
    if (USE_MOCK_API) {
        // Delay handled by Kiosk UI
        await new Promise(r => setTimeout(r, 1500));
        
        // Random success logic for demonstration
        const isSuccess = Math.random() > 0.3;
        
        if (isSuccess) {
            const randomStudent = MOCK_STUDENTS[Math.floor(Math.random() * MOCK_STUDENTS.length)];
            return { success: true, student: `${randomStudent.name} (${randomStudent.enrollmentNo})` };
        } else {
            return { success: false, message: "Face not recognized. Try again." };
        }
    }
    try {
        const res = await apiInstance.post('/recognize', { image, window_id: sessionId });
        return res.data;
    } catch (e) {
        return { success: false, message: 'Server Connection Error' };
    }
  },

  updateManualAttendance: async (enrollmentNo: string, subject: string, date: string, status: 'Present' | 'Absent'): Promise<void> => {
    if (USE_MOCK_API) return;
    await apiInstance.post('/attendance/manual', { enrollmentNo, subject, date, status });
  }
};