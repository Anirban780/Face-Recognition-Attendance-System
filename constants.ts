import { User, UserRole, Subject } from './types';

export const MOCK_SUBJECTS: Subject[] = [
  { id: 'sub1', code: 'CS101', name: 'Intro to Computer Science' },
  { id: 'sub2', code: 'MATH202', name: 'Advanced Calculus' },
  { id: 'sub3', code: 'PHY101', name: 'Physics I' },
  { id: 'sub4', code: 'ENG301', name: 'Software Engineering' },
];

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'Alice Student', 
    email: 'alice@edu.com', 
    enrollmentNo: 'STU001',
    password: 'password123',
    role: UserRole.STUDENT, 
    semester: 1,
    subjectIds: ['sub1', 'sub3'],
    avatar: 'https://picsum.photos/seed/alice/100/100' 
  },
  { 
    id: '2', 
    name: 'Bob Student', 
    email: 'bob@edu.com', 
    enrollmentNo: 'STU002',
    password: 'password123',
    role: UserRole.STUDENT, 
    semester: 3,
    subjectIds: ['sub2', 'sub4'],
    avatar: 'https://picsum.photos/seed/bob/100/100' 
  },
  { 
    id: '3', 
    name: 'Charlie Student', 
    email: 'charlie@edu.com', 
    enrollmentNo: 'STU003',
    password: 'password123',
    role: UserRole.STUDENT, 
    semester: 1,
    subjectIds: ['sub1', 'sub3'],
    avatar: 'https://picsum.photos/seed/charlie/100/100' 
  },
  { 
    id: '4', 
    name: 'Dr. Smith', 
    email: 'smith@edu.com', 
    enrollmentNo: 'FAC001',
    password: 'admin',
    role: UserRole.FACULTY, 
    subjectIds: ['sub1', 'sub4'], // Teaches CS and SE
    avatar: 'https://picsum.photos/seed/smith/100/100' 
  },
  { 
    id: '5', 
    name: 'Prof. Johnson', 
    email: 'johnson@edu.com', 
    enrollmentNo: 'FAC002',
    password: 'admin',
    role: UserRole.FACULTY, 
    subjectIds: ['sub2', 'sub3'], // Teaches Math and Physics
    avatar: 'https://picsum.photos/seed/johnson/100/100' 
  },
  { 
    id: '6', 
    name: 'Admin User', 
    email: 'admin@edu.com', 
    enrollmentNo: 'ADM001',
    password: 'admin',
    role: UserRole.ADMIN, 
    avatar: 'https://picsum.photos/seed/admin/100/100' 
  },
];