import React, { useState, useEffect } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { useApp } from '../context/AppContext';
import { UserRole, ClassSession } from '../types';
import { Check, X, LogOut, ArrowLeft, MonitorPlay } from 'lucide-react';

interface KioskProps {
  onNavigate: (page: string) => void;
}

const Kiosk: React.FC<KioskProps> = ({ onNavigate }) => {
  const { markAttendance, users, subjects, sessions } = useApp();
  const [activeSessions, setActiveSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ status: 'success' | 'error', message: string, studentName?: string } | null>(null);

  // Poll for active sessions
  useEffect(() => {
    const updateSessions = () => {
      // Find all active sessions
      const currentActive = sessions.filter(s => s.isActive);
      setActiveSessions(currentActive);
      
      // If the selected session is no longer active, clear selection
      if (selectedSession && !currentActive.find(s => s.id === selectedSession.id)) {
        setSelectedSession(null);
      }
    };

    updateSessions();
    const interval = setInterval(updateSessions, 5000);
    return () => clearInterval(interval);
  }, [sessions, selectedSession]);

  const handleCapture = async (imageData: string) => {
    if (!selectedSession) return;
    
    setIsProcessing(true);
    setResult(null);

    // MOCK RECOGNITION LOGIC
    setTimeout(async () => {
      // 80% chance of success
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        // Randomly identify a student who hasn't been marked yet
        const students = users.filter(u => u.role === UserRole.STUDENT);
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        
        await markAttendance(randomStudent.id, selectedSession.id);
        
        setResult({
          status: 'success',
          message: 'Attendance Marked Successfully',
          studentName: randomStudent.name
        });
      } else {
        setResult({
          status: 'error',
          message: 'Face Not Recognized. Please Try Again.'
        });
      }
      
      setIsProcessing(false);

      // Clear result after 3 seconds
      setTimeout(() => setResult(null), 3000);

    }, 1500);
  };

  const getSubject = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? subjects.find(s => s.id === session.subjectId) : null;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-8 py-6">
         <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-mono text-sm tracking-widest uppercase">Kiosk Mode Active</span>
         </div>
         <button onClick={() => onNavigate('home')} className="text-gray-400 hover:text-white transition-colors">
           <LogOut size={24} />
         </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        
        {!selectedSession ? (
          // Selection Screen
          <div className="w-full max-w-5xl animate-fade-in">
             <div className="text-center mb-12">
               <h2 className="text-4xl font-bold text-white mb-4">Select Live Class</h2>
               <p className="text-gray-400 text-lg">Choose a class to start attendance</p>
             </div>

             {activeSessions.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {activeSessions.map(session => {
                   const sub = getSubject(session.id);
                   const faculty = users.find(u => u.id === session.facultyId);
                   return (
                     <button
                       key={session.id}
                       onClick={() => setSelectedSession(session)}
                       className="bg-gray-800/80 border border-gray-700 p-8 rounded-2xl text-left hover:bg-gray-700/80 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
                     >
                       <div className="flex items-center justify-between mb-4">
                         <div className="bg-indigo-900/50 p-3 rounded-xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                           <MonitorPlay size={32} />
                         </div>
                         <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase rounded-full tracking-wider">Live Now</span>
                       </div>
                       <h3 className="text-2xl font-bold text-white mb-1">{sub?.name}</h3>
                       <p className="text-indigo-400 font-medium mb-4">{sub?.code}</p>
                       <div className="flex items-center text-gray-500 text-sm border-t border-gray-700 pt-4">
                         <span>By {faculty?.name || 'Unknown Faculty'}</span>
                         <span className="mx-2">•</span>
                         <span>Since {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                     </button>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center bg-gray-800/50 p-12 rounded-2xl border border-gray-700 backdrop-blur-sm max-w-md mx-auto">
                 <h2 className="text-2xl font-bold text-gray-400 mb-2">No Active Classes</h2>
                 <p className="text-gray-500">Waiting for faculty to start a session...</p>
               </div>
             )}
          </div>
        ) : (
          // Camera Screen
          <div className="w-full max-w-5xl animate-fade-in flex flex-col items-center">
             <button 
               onClick={() => setSelectedSession(null)}
               className="self-start mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
             >
               <ArrowLeft size={20} className="mr-2" /> Back to Classes
             </button>

             <div className="w-full bg-gray-800/80 p-6 rounded-3xl shadow-2xl border border-gray-700 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6 px-2">
                   <div>
                     <h2 className="text-3xl font-bold text-white">{getSubject(selectedSession.id)?.name}</h2>
                     <p className="text-indigo-400 text-lg">{getSubject(selectedSession.id)?.code}</p>
                   </div>
                   <div className="text-right">
                     <div className="text-sm text-gray-400">Session ID</div>
                     <div className="font-mono text-gray-500">{selectedSession.id}</div>
                   </div>
                </div>

                <WebcamCapture 
                  onCapture={handleCapture} 
                  isProcessing={isProcessing} 
                  className="w-full aspect-[16/9] max-h-[60vh]"
                />

                {/* Result Overlay */}
                {result && (
                  <div className={`mt-6 p-6 rounded-xl flex items-center justify-center space-x-4 animate-fade-in ${
                    result.status === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'
                  }`}>
                    {result.status === 'success' ? <Check size={32} /> : <X size={32} />}
                    <div className="text-left">
                      <p className="font-bold text-2xl">{result.message}</p>
                      {result.studentName && <p className="text-lg text-white">Welcome, {result.studentName}!</p>}
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="relative z-10 py-6 text-center text-gray-500 text-sm">
        <p>System Ver. 1.0.0 (Mock)</p>
      </div>
    </div>
  );
};

export default Kiosk;