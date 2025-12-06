import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Inject Global CSS (simulating index.css content for single-file operation)
const GlobalStyles = () => (
    <style>
        {`
        /* Load Inter font and apply to all elements */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        
        /* NOTE: The error 'no matching @tailwind base directive is present' indicates your local environment 
           is trying to compile Tailwind CSS files. We are bypassing that faulty local compilation setup
           by including basic global styles here. */

        body, #root, .font-sans {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            width: 100%;
        }

        html, body {
            height: 100%;
        }
        `}
    </style>
);

// --- MOCK DATA AND API SIMULATION (No Backend/Firebase) ---

const MOCK_CLASSES = [
  { id: 'C001', name: 'Software Engineering', code: 'SE401', facultyId: 'T101' },
  { id: 'C002', name: 'Database Management', code: 'DB305', facultyId: 'T101' },
  { id: 'C003', name: 'Data Structures', code: 'DS202', facultyId: 'T102' },
];

const MOCK_ATTENDANCE_DATA = [
  // Class C001 Records
  { 
    sessionId: 'S101', classId: 'C001', sessionDate: '2025-10-26', totalStudents: 30, presentCount: 28,
    presentStudents: [
        { id: 1, name: 'Alice Johnson', enrollmentNo: 'S1001', time: '11:15 AM', method: 'Face' },
        { id: 2, name: 'Bob Williams', enrollmentNo: 'S1002', time: '11:17 AM', method: 'Face' },
        // ... 26 more students
    ]
  },
  { 
    sessionId: 'S102', classId: 'C001', sessionDate: '2025-10-24', totalStudents: 30, presentCount: 25,
    presentStudents: [
        { id: 4, name: 'Alice Johnson', enrollmentNo: 'S1001', time: '11:05 AM', method: 'Face' },
        // ... 24 more students
    ]
  },
  // Class C002 Records
  { 
    sessionId: 'S201', classId: 'C002', sessionDate: '2025-10-25', totalStudents: 25, presentCount: 20,
    presentStudents: [
        { id: 5, name: 'Charlie Davis', enrollmentNo: 'S1003', time: '10:00 AM', method: 'Face' },
        // ... 19 more students
    ]
  },
];

const MOCK_API = {
  // Mock login: use username/password 'teacher/pass' or 'student/pass'
  login: ({ username, password }) => new Promise(resolve => {
    setTimeout(() => {
      if (username === 'teacher' && password === 'pass') {
        resolve({ success: true, user: { id: 'T101', name: 'Dr. Smith', role: 'faculty' } });
      } else if (username === 'student' && password === 'pass') {
        resolve({ success: true, user: { id: 'S1001', name: 'Alice Johnson', role: 'student', enrollmentNo: 'S1001' } });
      } else if (username === 'kiosk') {
        resolve({ success: true, user: { id: 'K001', name: 'Main Gate Kiosk', role: 'kiosk' } });
      } else {
        resolve({ success: false, message: 'Invalid credentials.' });
      }
    }, 1000);
  }),
  // Mock face recognition function (simulates success/failure)
  recognizeFace: (imageData, classId) => new Promise(resolve => {
    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        const student = { name: 'Mock Student', enrollmentNo: `S${Math.floor(Math.random() * 9000) + 1000}` };
        resolve({
          success: true,
          message: `Attendance marked for ${student.name} (${student.enrollmentNo})!`,
          student,
        });
      } else {
        const reason = Math.random() > 0.5 ? 'Unknown Face' : 'Face Not Clear';
        resolve({
          success: false,
          message: `Recognition Failed: ${reason}. Please try again.`,
        });
      }
    }, 2500);
  }),
};

// --- ICONS (SVG Components) ---

const ICONS = {
    User: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    Camera: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3H21v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1z" /><circle cx="12" cy="11" r="4" /><path d="M15 11h.01M9 11h.01" /></svg>,
    LayoutDashboard: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
    LogOut: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
    BookOpen: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 19V5c0-1.1.9-2 2-2h12l4 4v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z" /><path d="M16 3v4h4" /></svg>,
    Clock: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M20 5.23A8 8 0 0 0 12 2" /></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    Loader2: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>,
    List: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
};


// --- AUTH CONTEXT AND PROVIDER (Consolidated) ---
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// TOAST COMPONENT (Helper)
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-white font-semibold ${typeClasses[type]}`}>
      {message}
    </div>
  );
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const isAuthReady = true; 
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const login = useCallback(async ({ username, password }) => {
    try {
        const { success, user: loggedInUser, message } = await MOCK_API.login({ username, password });
        if (success) {
        setUser(loggedInUser);
        showToast('Login successful!', 'success');
        return true;
        } else {
        setUser(null);
        showToast(message, 'error');
        return false;
        }
    } catch (e) {
        console.error("Login mock API failed:", e);
        showToast('Login failed due to simulation error.', 'error');
        return false;
    }
  }, [showToast]);

  const logout = useCallback(() => {
    setUser(null);
    showToast('Logged out.', 'info');
  }, [showToast]);

  const value = { user, login, logout, isAuthReady, showToast, userId: user?.id || 'mock-user' };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </AuthContext.Provider>
  );
};


// --- SHARED LAYOUT ---
const DashboardLayout = ({ children, title, onBack, backRouteName }) => {
  const { user, logout } = useAuth();
  const getRoleColor = (role) => {
    if (role === 'faculty') return 'bg-blue-600';
    if (role === 'student') return 'bg-green-600';
    return 'bg-gray-600';
  };

  const { LayoutDashboard, LogOut } = ICONS;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-3 text-indigo-600" />
            {title}
          </h1>
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                  onClick={onBack}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition duration-150"
              >
                  &larr; {backRouteName || 'Back'}
              </button>
            )}
            <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${getRoleColor(user?.role)}`}>
              {user?.role.toUpperCase()}
            </span>
            <span className="text-gray-700 font-medium hidden sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 transition duration-150"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

// --- 1. LOGIN PAGE (Routes to Dashboard or Kiosk) ---
const LoginPage = ({ setRoute }) => {
  const { login, showToast } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { Camera, LogOut, Loader2, Users } = ICONS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    setIsLoading(true);
    const success = await login({ username, password });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col justify-center items-center p-4 w-full">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <Camera className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Attendance System
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Face Recognition & Management
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-gray-600 text-center font-medium">Log in as Teacher/Student (teacher/pass or student/pass)</p>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 transform hover:scale-[1.01]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
            ) : (
              <LogOut className="w-5 h-5 mr-2 -scale-x-100" />
            )}
            {isLoading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div className="mt-8 space-y-3">
            <p className="text-center text-sm text-gray-500">Or use dedicated buttons:</p>
            
            <button
                onClick={() => setRoute('kiosk')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none transition duration-150"
            >
                <Users className="w-5 h-5 mr-2" />
                Give Attendance (Student Side)
            </button>
            <button
                onClick={() => setRoute('login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-teal-600 bg-teal-100 hover:bg-teal-200 focus:outline-none transition duration-150"
            >
                <LogOut className="w-5 h-5 mr-2" />
                Login (Teacher/Student Side)
            </button>
        </div>
      </div>
    </div>
  );
};

// --- TEACHER DASHBOARD SUB-COMPONENTS ---

const DashboardCard = ({ title, icon, bgColor, onClick, description }) => (
    <div
        className={`p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition duration-300 transform hover:scale-[1.01] ${bgColor} bg-opacity-90`}
        onClick={onClick}
    >
        <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-white bg-opacity-30">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-white text-opacity-80">{description}</p>
            </div>
        </div>
    </div>
);

const ActiveSessionCard = ({ session, onEnd }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const { Clock } = ICONS;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - session.startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-red-50 border-2 border-red-500 p-6 rounded-xl shadow-2xl space-y-4">
      <h3 className="text-2xl font-bold text-red-700 flex items-center">
        <Clock className="w-6 h-6 mr-3 animate-pulse" />
        LIVE ATTENDANCE SESSION ACTIVE
      </h3>
      <div className="grid grid-cols-2 gap-4 text-lg">
        <p><span className="font-semibold">Class:</span> {session.class.name}</p>
        <p><span className="font-semibold">Time Elapsed:</span> <span className="text-red-600 font-mono">{formatTime(timeElapsed)}</span></p>
        <p><span className="font-semibold">Start Time:</span> {session.startTime.toLocaleTimeString()}</p>
        <p><span className="font-semibold">Students Marked:</span> <span className="text-green-600 font-bold">{session.studentsMarked}</span></p>
      </div>
      <button
        onClick={onEnd}
        className="w-full py-3 px-4 bg-red-600 text-white text-lg font-medium rounded-xl shadow-lg hover:bg-red-700 transition duration-150"
      >
        End Attendance Session
      </button>
      <p className="text-sm text-red-500 italic">Kiosk mode is now active for this class ({session.class.code}).</p>
    </div>
  );
};

const ClassList = ({ onStartSession }) => {
    const { Clock } = ICONS;
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Select Class to Start Attendance</h3>
            <div className="space-y-3">
            {MOCK_CLASSES.map(cls => (
                <div
                key={cls.id}
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition duration-150"
                >
                <div>
                    <p className="font-semibold text-gray-800">{cls.name}</p>
                    <p className="text-sm text-gray-500">{cls.code}</p>
                </div>
                <button
                    onClick={() => onStartSession(cls)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-green-700 transition duration-150 flex items-center"
                >
                    <Clock className="w-4 h-4 mr-2" />
                    Start Session
                </button>
                </div>
            ))}
            </div>
            {MOCK_CLASSES.length === 0 && <p className="text-center text-gray-500 py-4">No classes available. Create one first.</p>}
        </div>
    );
};

const CreateClassForm = ({ showToast, setActiveTab }) => {
    const [className, setClassName] = useState('');
    const [classCode, setClassCode] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { BookOpen, Loader2, LayoutDashboard } = ICONS;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!className || !classCode || !startTime || !endTime) {
            showToast('All fields are required.', 'error');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            MOCK_CLASSES.push({ id: `C${MOCK_CLASSES.length + 1}`, name: className, code: classCode, facultyId: 'T101' });
            showToast(`Class "${className}" created successfully! Time: ${startTime} - ${endTime}`, 'success');
            setClassName('');
            setClassCode('');
            setStartTime('');
            setEndTime('');
            setIsLoading(false);
            setActiveTab('dashboard'); // Go back to dashboard after creation
        }, 1000);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-semibold">Create New Class/Subject</h3>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                    <LayoutDashboard className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="className" className="block text-sm font-medium text-gray-700">
                        Class/Subject Name
                    </label>
                    <input
                        id="className"
                        type="text"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="classCode" className="block text-sm font-medium text-gray-700">
                        Course Code (e.g., SE401)
                    </label>
                    <input
                        id="classCode"
                        type="text"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                {/* 1. Added Time Option */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                            Start Time
                        </label>
                        <input
                            id="startTime"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                            End Time
                        </label>
                        <input
                            id="endTime"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <BookOpen className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Creating...' : 'Create Class'}
                </button>
            </form>
        </div>
    );
};

const SessionDetailModal = ({ session, onClose }) => {
    const { User, CheckCircle, XCircle } = ICONS;
    const isPresent = (enrollment) => session.presentStudents.some(s => s.enrollmentNo === enrollment);
    
    // Mock List of all possible students (for absent calculation)
    const allStudents = [
        { name: 'Alice Johnson', enrollmentNo: 'S1001' },
        { name: 'Bob Williams', enrollmentNo: 'S1002' },
        { name: 'Charlie Davis', enrollmentNo: 'S1003' },
        { name: 'Diana Prince', enrollmentNo: 'S1004' },
    ];
    
    const students = allStudents.map(student => ({
        ...student,
        present: isPresent(student.enrollmentNo),
        time: session.presentStudents.find(s => s.enrollmentNo === student.enrollmentNo)?.time || 'N/A'
    }));

    if (!session) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-2xl font-bold border-b pb-2 mb-4 text-indigo-600">
                        Attendance Details: {session.class.name}
                    </h3>
                    <p className="mb-4 text-gray-600">Date: {session.sessionDate}</p>
                    <p className="mb-4 text-gray-600">Present: **{session.presentCount}** / {session.totalStudents}</p>

                    <div className="space-y-3">
                        {students.map((student, index) => (
                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${student.present ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className="flex items-center space-x-3">
                                    {student.present ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                                    <div>
                                        <p className="font-medium text-gray-800">{student.name}</p>
                                        <p className="text-xs text-gray-500">{student.enrollmentNo}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-semibold ${student.present ? 'text-green-600' : 'text-red-600'}`}>
                                    {student.present ? `Present (${student.time})` : 'Absent'}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-6 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const ClassRecord = ({ setActiveTab }) => {
    const { LayoutDashboard } = ICONS;
    const [selectedClassId, setSelectedClassId] = useState(MOCK_CLASSES[0]?.id || '');
    const [selectedSession, setSelectedSession] = useState(null);

    const filteredSessions = MOCK_ATTENDANCE_DATA.filter(session => session.classId === selectedClassId);
    const selectedClass = MOCK_CLASSES.find(c => c.id === selectedClassId);
    
    // 3. Class-wise data summary
    const summaryByDate = filteredSessions.reduce((acc, session) => {
        acc[session.sessionDate] = {
            present: session.presentCount,
            total: session.totalStudents,
            sessionId: session.sessionId,
            sessionObj: session,
        };
        return acc;
    }, {});

    useEffect(() => {
      if (!selectedClassId && MOCK_CLASSES.length > 0) {
        setSelectedClassId(MOCK_CLASSES[0].id);
      }
    }, [selectedClassId]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-semibold">Class Attendance Records</h3>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                    <LayoutDashboard className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>
            </div>

            <div className="mb-6">
                <label htmlFor="classSelect" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Class:
                </label>
                <select
                    id="classSelect"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="mt-1 block w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {MOCK_CLASSES.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.code})
                        </option>
                    ))}
                </select>
            </div>
            
            {selectedClass ? (
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance (%)</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {Object.keys(summaryByDate).sort((a, b) => new Date(b) - new Date(a)).map(date => {
                              const summary = summaryByDate[date];
                              const percentage = ((summary.present / summary.total) * 100).toFixed(1);
                              return (
                                  <tr key={date}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{date}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                              {summary.present} Present / {summary.total - summary.present} Absent
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{percentage}%</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                          <button
                                              onClick={() => setSelectedSession(summary.sessionObj)}
                                              className="text-indigo-600 hover:text-indigo-900"
                                          >
                                              View Students
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
            ) : (
                <p className="text-center text-gray-500 py-8">No classes available to show records.</p>
            )}

            {selectedSession && (
                <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
            )}
        </div>
    );
};

// --- TEACHER DASHBOARD MAIN PAGE ---
const TeacherDashboard = () => {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'create-class', 'class-record'
  const { BookOpen, List } = ICONS;

  // Mock Active Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  const startSession = (classItem) => {
    setIsSessionActive(true);
    setActiveSession({
      id: `S${Date.now()}`,
      class: classItem,
      startTime: new Date(),
      studentsMarked: 0,
    });
    showToast(`Attendance session started for ${classItem.name}.`, 'success');
  };

  const endSession = () => {
    setIsSessionActive(false);
    setActiveSession(null);
    showToast('Attendance session ended.', 'info');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'create-class':
        return <CreateClassForm showToast={showToast} setActiveTab={setActiveTab} />;
      case 'class-record':
        return <ClassRecord setActiveTab={setActiveTab} />;
      default:
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800">Attendance Management</h2>
            {isSessionActive ? (
              <ActiveSessionCard session={activeSession} onEnd={endSession} />
            ) : (
              <ClassList onStartSession={startSession} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard 
                    title="Create New Class" 
                    icon={<BookOpen className="w-8 h-8 text-white" />} 
                    bgColor="bg-indigo-500" 
                    onClick={() => setActiveTab('create-class')}
                    description="Set up new subjects, course codes, and assign students."
                />
                <DashboardCard 
                    title="View Class Records" 
                    icon={<List className="w-8 h-8 text-white" />} 
                    bgColor="bg-teal-500" 
                    onClick={() => setActiveTab('class-record')}
                    description="Check attendance history, export reports, and resolve exceptions."
                />
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout title="Teacher Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

// --- 3. STUDENT PORTAL ---
const StudentPortal = () => {
    const { user } = useAuth();
    const { User } = ICONS;
    const studentName = user?.name || 'Student';
    const enrollmentNo = user?.enrollmentNo || 'N/A';
    
    // Mock data for student's attendance
    const studentAttendance = [
        { date: '2024-10-26', subject: 'Software Engineering', status: 'Present', time: '11:15 AM' },
        { date: '2024-10-25', subject: 'Database Management', status: 'Absent', time: 'N/A' },
        { date: '2024-10-24', subject: 'Software Engineering', status: 'Present', time: '11:05 AM' },
    ];

    const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
    const totalCount = studentAttendance.length;
    const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(2) : '0.00';

    return (
        <DashboardLayout title="Student Portal">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit">
                    <h3 className="text-2xl font-bold text-indigo-600 mb-4 flex items-center">
                        <User className="w-6 h-6 mr-2" />
                        My Profile
                    </h3>
                    <div className="space-y-3 text-gray-700">
                        <p className="text-xl font-semibold">{studentName}</p>
                        <p className="text-sm"><span className="font-medium">Enrollment No:</span> {enrollmentNo}</p>
                        <p className="text-sm"><span className="font-medium">Role:</span> Student</p>
                    </div>
                    <div className="mt-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
                        <p className="font-semibold text-indigo-700">Overall Attendance:</p>
                        <p className="text-3xl font-extrabold text-indigo-600 mt-1">{percentage}%</p>
                        <p className="text-sm text-indigo-500">({presentCount} out of {totalCount} classes)</p>
                    </div>
                </div>

                {/* Attendance History */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Attendance History</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {studentAttendance.map((record, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.time}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};


// --- 4. KIOSK PAGE (GIVE ATTENDANCE) ---
const KioskPage = () => {
    const { showToast } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [status, setStatus] = useState('Select Class'); // Select Class, Camera Ready, Capturing, Processing, Complete
    const [recognitionMessage, setRecognitionMessage] = useState('');
    const [classId, setClassId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null); // { success: boolean, student: object }
    const { Camera, Loader2, Users, XCircle, CheckCircle } = ICONS;

    const initializeCamera = useCallback(async () => {
        try {
            setStatus('Camera Ready');
            // Check for media devices API support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setStatus('Camera Error');
                setRecognitionMessage('Camera not supported by browser.');
                showToast('Camera access failed: Browser not supported.', 'error');
                return;
            }
            
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
            setStream(mediaStream);
            setRecognitionMessage('Camera feed started. Press "Mark Attendance" when ready.');
        } catch (err) {
            console.error("Error accessing camera: ", err);
            setStatus('Camera Error');
            setRecognitionMessage('Cannot access camera. Please check permissions.');
            showToast('Camera access denied or failed.', 'error');
        }
    }, [showToast]);

    useEffect(() => {
        // Automatically start camera if a class is selected
        if (classId && status === 'Select Class') {
            initializeCamera();
        }

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [classId, stream, status, initializeCamera]);

    const handleCaptureAndRecognize = async () => {
        if (status !== 'Camera Ready' || !classId) {
            showToast('Please ensure a class is selected and the camera is ready.', 'info');
            return;
        }

        setIsLoading(true);
        setStatus('Capturing');
        setRecognitionMessage('Capturing face...');
        setResult(null);

        // 1. Capture frame to canvas
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) {
            showToast('Video or Canvas element is not ready.', 'error');
            setIsLoading(false);
            setStatus('Camera Ready');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 2. Convert to base64 for API transmission
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // 3. Simulate API call
        setStatus('Processing');
        setRecognitionMessage('Sending image for recognition...');

        const recognitionResult = await MOCK_API.recognizeFace(imageData, classId);

        // 4. Update UI with result
        if (recognitionResult.success) {
            setRecognitionMessage(recognitionResult.message);
            setResult({ success: true, name: recognitionResult.student.name });
            showToast(recognitionResult.message, 'success');
        } else {
            setRecognitionMessage(recognitionResult.message);
            setResult({ success: false, name: null });
            showToast(recognitionResult.message, 'error');
        }

        setIsLoading(false);
        setStatus('Camera Ready'); // Ready for next capture
    };

    const getStatusClasses = () => {
        if (isLoading) return 'bg-yellow-500 text-white';
        if (result?.success) return 'bg-green-500 text-white';
        if (result !== null && !result.success) return 'bg-red-500 text-white';
        if (status === 'Camera Ready') return 'bg-indigo-500 text-white';
        return 'bg-gray-500 text-white'; 
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8 w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-400 mb-6 flex items-center">
                <Camera className="w-8 h-8 mr-3" />
                Facial Attendance Kiosk
            </h1>
            
            {/* Class Selection */}
            <div className="mb-6 w-full max-w-lg">
                <label htmlFor="class-select" className="block text-lg font-medium text-gray-300 mb-2">
                    1. Select Class/Subject
                </label>
                <select
                    id="class-select"
                    value={classId}
                    onChange={(e) => {
                        setClassId(e.target.value);
                        if (e.target.value && status === 'Select Class') {
                            // Trigger camera initialization on class selection
                        }
                    }}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                >
                    <option value="">-- Choose Active Class --</option>
                    {MOCK_CLASSES.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.code})
                        </option>
                    ))}
                </select>
            </div>

            {/* Video Preview and Status */}
            <div className="w-full max-w-4xl aspect-video bg-gray-800 rounded-xl shadow-2xl relative overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${status === 'Camera Ready' || status === 'Processing' ? 'opacity-100' : 'opacity-50'}`} 
                />
                
                {/* Overlay Status Message */}
                <div className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-300 ${getStatusClasses()} bg-opacity-90`}>
                    <div className="text-center">
                        {isLoading && <Loader2 className="animate-spin w-10 h-10 mx-auto mb-3" />}
                        {status === 'Camera Error' && <XCircle className="w-10 h-10 mx-auto mb-3" />}
                        {result?.success && <CheckCircle className="w-10 h-10 mx-auto mb-3" />}
                        {result !== null && !result.success && <XCircle className="w-10 h-10 mx-auto mb-3" />}

                        <p className="text-xl font-bold">{recognitionMessage || status}</p>
                        {result?.success && result.name && <p className="text-3xl mt-2 font-extrabold">{result.name}</p>}
                    </div>
                </div>

                {/* Hidden Canvas for Capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Action Button */}
            <button
                onClick={handleCaptureAndRecognize}
                disabled={isLoading || !classId || status === 'Camera Error'}
                className="mt-6 w-full max-w-lg py-4 px-6 bg-indigo-600 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition duration-150 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center transform hover:scale-[1.02]"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin w-6 h-6 mr-3" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Users className="w-6 h-6 mr-3" />
                        2. Mark Attendance
                    </>
                )}
            </button>
             <p className="text-sm text-gray-400 mt-2">
                Note: This simulation uses your webcam to capture an image and sends it to a mock API for recognition.
            </p>
        </div>
    );
};


// --- MAIN APP COMPONENT (Router) ---
const App = () => {
  const { user, isAuthReady, userId } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('home'); // home, kiosk, login

  // Handle auto-redirect after login
  useEffect(() => {
    if (user) {
      if (user.role === 'faculty') {
        setCurrentRoute('teacher');
      } else if (user.role === 'student') {
        setCurrentRoute('student');
      } else if (user.role === 'kiosk') {
        setCurrentRoute('kiosk');
      } else {
        // Fallback for unexpected role
        setCurrentRoute('teacher');
      }
    } else {
      setCurrentRoute('home');
    }
  }, [user]);

  // Log Auth Status
  useEffect(() => {
          console.log(`[Auth Status] Ready. User ID: ${userId}`);
  }, [userId]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <ICONS.Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        <p className="ml-3 text-lg font-medium text-gray-700">Initializing Application...</p>
      </div>
    );
  }

  const renderContent = () => {
    // 1. Logged In User Routing
    if (user) {
      if (user.role === 'faculty') return <TeacherDashboard />;
      if (user.role === 'student') return <StudentPortal />;
      if (user.role === 'kiosk') return <KioskPage />;
      return <TeacherDashboard />; // Fallback
    }

    // 2. Unauthenticated/Home/Kiosk/Login Routing
    if (currentRoute === 'kiosk') {
        return <KioskPage />;
    }
    
    // We treat the main component as a router. 
    // If the user clicks 'login' from the initial landing page, we show the login form, 
    // otherwise we show the primary Home page with the two main buttons.
    if (currentRoute === 'login') {
        return <LoginPage setRoute={setCurrentRoute} />;
    }
    
    // Default Home Page (2 buttons)
    return <HomePage setRoute={setCurrentRoute} />;
  };

  return (
    <>
      <GlobalStyles />
      <div className="font-sans min-h-screen w-full">
          {renderContent()}
      </div>
    </>
  );
};


// --- NEW HOME PAGE COMPONENT (Required for point 2) ---
const HomePage = ({ setRoute }) => {
    const { Camera, LogOut } = ICONS;
    
    return (
        <div className="min-h-screen bg-indigo-50 flex flex-col justify-center items-center p-4 w-full">
            <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-xl shadow-2xl text-center">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                    Welcome to Attendance System
                </h2>
                <p className="text-gray-600 mb-8">Choose your path to begin.</p>

                <div className="space-y-4">
                    {/* GIVE ATTENDANCE Button */}
                    <button
                        onClick={() => setRoute('kiosk')}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 transform hover:scale-[1.01]"
                    >
                        <Camera className="w-6 h-6 mr-3" />
                        Give Attendance
                    </button>
                    
                    {/* LOGIN Button */}
                    <button
                        onClick={() => setRoute('login')}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md text-lg font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition duration-150"
                    >
                        <LogOut className="w-6 h-6 mr-3 -scale-x-100" />
                        Login (Teacher/Student)
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- APPLICATION MOUNTING ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
} else {
    console.error("The root element 'root' was not found in the document.");
}