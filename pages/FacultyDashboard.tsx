import React, { useEffect, useState } from 'react';
import { api, SUBJECTS } from '../services/api';
import { AttendanceSession, Student } from '../types';
import { useAuth } from '../context/AuthContext';
import { Play, Calendar, Users, Clock, ClipboardList, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');

  // Manual Attendance Modal State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [sessionStudents, setSessionStudents] = useState<{ student: Student, isPresent: boolean }[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectCode) return;
    try {
      await api.createSession(selectedSubjectCode);
      setSelectedSubjectCode('');
      loadSessions();
    } catch (error) {
      console.error(error);
    }
  };

  const openAttendanceModal = async (session: AttendanceSession) => {
    setSelectedSession(session);
    setShowAttendanceModal(true);
    
    // 1. Get all students enrolled in this subject
    const enrolledStudents = await api.getStudentsBySubject(session.subjectCode);
    
    // 2. Get attendance records for this session
    const records = await api.getAttendanceBySession(session.subject, session.date);
    
    // 3. Merge data
    const mergedData = enrolledStudents.map(student => {
      const isPresent = records.some(r => r.enrollmentNo === student.enrollmentNo && r.status === 'Present');
      return { student, isPresent };
    });
    
    setSessionStudents(mergedData);
  };

  const toggleAttendance = async (student: Student, currentStatus: boolean) => {
    if (!selectedSession) return;
    const newStatus = !currentStatus;
    
    // Update UI immediately (optimistic)
    setSessionStudents(prev => prev.map(item => 
      item.student.id === student.id ? { ...item, isPresent: newStatus } : item
    ));

    // Call API
    await api.updateManualAttendance(
      student.enrollmentNo, 
      selectedSession.subject, 
      selectedSession.date, 
      newStatus ? 'Present' : 'Absent'
    );
    
    // Refresh session list to update counts
    loadSessions(); 
  };

  // Get subjects assigned to this faculty
  const mySubjects = SUBJECTS.filter(s => user?.assignedSubjects?.includes(s.code));

  // Prepare chart data
  const chartData = sessions.map(s => ({
    name: s.subjectCode,
    present: s.totalPresent,
    total: s.totalStudents
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Session Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Play className="w-5 h-5 mr-2 text-green-600" />
            Start New Session
          </h2>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedSubjectCode}
                onChange={e => setSelectedSubjectCode(e.target.value)}
              >
                <option value="">-- Select Subject --</option>
                {mySubjects.map(sub => (
                    <option key={sub.code} value={sub.code}>
                        {sub.code} - {sub.name}
                    </option>
                ))}
              </select>
            </div>
            {mySubjects.length === 0 && (
                <p className="text-xs text-red-500">You are not assigned to any subjects.</p>
            )}
            <button
              type="submit"
              disabled={!selectedSubjectCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Launch Session
            </button>
          </form>
        </div>

        {/* Analytics Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Attendance Overview</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active & Recent Sessions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading sessions...</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-gray-900">{session.subject}</h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {session.subjectCode}
                      </span>
                      {session.isActive && (
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        {session.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {session.startTime} - {session.endTime}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">Attendance</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {session.totalStudents > 0 ? Math.round((session.totalPresent / session.totalStudents) * 100) : 0}%
                      </div>
                    </div>
                    
                    <button 
                        onClick={() => openAttendanceModal(session)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Manage Attendance"
                    >
                        <ClipboardList className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showAttendanceModal && selectedSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Attendance</h2>
                        <p className="text-sm text-gray-500">{selectedSession.subject} ({selectedSession.subjectCode})</p>
                    </div>
                    <button onClick={() => setShowAttendanceModal(false)} className="text-gray-400 hover:text-gray-500">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {sessionStudents.length === 0 ? (
                        <p className="text-center text-gray-500">No students enrolled in this subject.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Student</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Enrollment</th>
                                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sessionStudents.map(({ student, isPresent }) => (
                                    <tr key={student.id}>
                                        <td className="py-3 text-sm font-medium text-gray-900">{student.name}</td>
                                        <td className="py-3 text-sm text-gray-500">{student.enrollmentNo}</td>
                                        <td className="py-3 text-right">
                                            <button 
                                                onClick={() => toggleAttendance(student, isPresent)}
                                                className={`
                                                    inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors
                                                    ${isPresent 
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'}
                                                `}
                                            >
                                                {isPresent ? (
                                                    <><CheckCircle className="w-3 h-3 mr-1" /> Present</>
                                                ) : (
                                                    <><XCircle className="w-3 h-3 mr-1" /> Absent</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                    <button 
                        onClick={() => setShowAttendanceModal(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};