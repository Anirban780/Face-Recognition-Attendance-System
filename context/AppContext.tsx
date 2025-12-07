import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ClassSession, AttendanceRecord, UserRole, Subject, MockFaceData } from '../types';
import { MOCK_USERS, MOCK_SUBJECTS } from '../constants';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  subjects: Subject[];
  sessions: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  faceDatabase: MockFaceData[];
  login: (identifier: string, password?: string) => boolean;
  logout: () => void;
  startSession: (subjectId: string, startTime: string, endTime: string) => ClassSession;
  endSession: (sessionId: string) => void;
  markAttendance: (studentId: string, sessionId: string) => Promise<boolean>;
  trainModel: (studentId: string, images: File[]) => Promise<void>;
  getActiveSession: (facultyId?: string) => ClassSession | undefined;
  addUser: (user: Omit<User, 'id' | 'avatar'>) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [faceDatabase, setFaceDatabase] = useState<MockFaceData[]>(
    MOCK_USERS.filter(u => u.role === UserRole.STUDENT).map(u => ({ studentId: u.id, imageCount: 3 }))
  );

  const login = (identifier: string, password?: string): boolean => {
    // Check against email OR enrollmentNo
    const user = users.find(u => 
      (u.email === identifier || u.enrollmentNo === identifier) && 
      u.password === password
    );

    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const startSession = (subjectId: string, startTime: string, endTime: string): ClassSession => {
    if (!currentUser || currentUser.role !== UserRole.FACULTY) {
      throw new Error("Only faculty can start sessions");
    }

    // End any existing active session for this faculty
    const existingSession = sessions.find(s => s.facultyId === currentUser.id && s.isActive);
    if (existingSession) {
      endSession(existingSession.id);
    }

    const newSession: ClassSession = {
      id: Math.random().toString(36).substr(2, 9),
      subjectId,
      facultyId: currentUser.id,
      startTime: startTime,
      endTime: endTime, 
      isActive: true,
    };

    setSessions(prev => [...prev, newSession]);
    return newSession;
  };

  const endSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, isActive: false } : s
    ));
  };

  const markAttendance = async (studentId: string, sessionId: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if already attended
    const alreadyAttended = attendanceRecords.some(
      r => r.studentId === studentId && r.sessionId === sessionId
    );

    if (alreadyAttended) return true;

    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      sessionId,
      studentId,
      timestamp: new Date().toISOString(),
      verified: true,
    };

    setAttendanceRecords(prev => [...prev, newRecord]);
    return true;
  };

  const trainModel = async (studentId: string, images: File[]) => {
    // Simulate training delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFaceDatabase(prev => {
      const existing = prev.find(f => f.studentId === studentId);
      if (existing) {
        return prev.map(f => f.studentId === studentId ? { ...f, imageCount: f.imageCount + images.length } : f);
      }
      return [...prev, { studentId, imageCount: images.length }];
    });
  };

  const getActiveSession = (facultyId?: string) => {
    const now = new Date();
    // Filter sessions that are marked active AND current time is before end time
    const activeAndValid = sessions.filter(s => {
      if (!s.isActive) return false;
      if (s.endTime && new Date(s.endTime) < now) return false;
      return true;
    });

    if (facultyId) {
      return activeAndValid.find(s => s.facultyId === facultyId);
    }
    // For kiosk, just return the most recently started active session
    return activeAndValid.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
  };

  const addUser = (userData: Omit<User, 'id' | 'avatar'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      avatar: `https://picsum.photos/seed/${userData.email}/100/100`
    };
    setUsers(prev => [...prev, newUser]);
    
    // If student, init face db entry
    if (userData.role === UserRole.STUDENT) {
      setFaceDatabase(prev => [...prev, { studentId: newUser.id, imageCount: 0 }]);
    }
  };

  const addSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subjectData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      subjects,
      sessions,
      attendanceRecords,
      faceDatabase,
      login,
      logout,
      startSession,
      endSession,
      markAttendance,
      trainModel,
      getActiveSession,
      addUser,
      addSubject
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};