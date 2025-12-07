import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StudentDashboard: React.FC = () => {
  const { currentUser, subjects, attendanceRecords, sessions } = useApp();

  if (!currentUser) return null;

  // Filter subjects assigned to this student
  const mySubjects = subjects.filter(sub => currentUser.subjectIds?.includes(sub.id));

  // Calculate stats per subject
  const stats = mySubjects.map(sub => {
    // Find all sessions for this subject
    const subjectSessions = sessions.filter(s => s.subjectId === sub.id && !s.isActive); // Only count completed or all? Usually all past
    const totalClasses = subjectSessions.length;
    
    const attendedCount = attendanceRecords.filter(r => 
      r.studentId === currentUser.id && 
      subjectSessions.some(s => s.id === r.sessionId)
    ).length;

    const percentage = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 0;

    return {
      subjectName: sub.code,
      fullName: sub.name,
      totalClasses,
      attendedCount,
      percentage
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-4 mb-8">
         <img src={currentUser.avatar} alt="Profile" className="w-16 h-16 rounded-full border-2 border-indigo-100" />
         <div>
           <h1 className="text-2xl font-bold text-gray-900">{currentUser.name}</h1>
           <p className="text-gray-500">Student ID: {currentUser.enrollmentNo || currentUser.id}</p>
           {currentUser.semester && <p className="text-sm text-gray-400">Semester: {currentUser.semester}</p>}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Attendance Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
           <h2 className="text-lg font-semibold text-gray-800 mb-6">Attendance Overview</h2>
           {stats.length > 0 ? (
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats}>
                 <XAxis dataKey="subjectName" tick={{fontSize: 12}} />
                 <YAxis domain={[0, 100]} />
                 <Tooltip 
                   cursor={{fill: '#f3f4f6'}}
                   content={({ active, payload }) => {
                     if (active && payload && payload.length) {
                       const data = payload[0].payload;
                       return (
                         <div className="bg-white p-3 shadow-lg rounded border border-gray-100">
                           <p className="font-bold text-indigo-900">{data.fullName}</p>
                           <p className="text-gray-600">Attended: {data.attendedCount}/{data.totalClasses}</p>
                           <p className="font-semibold text-indigo-600">{data.percentage}%</p>
                         </div>
                       );
                     }
                     return null;
                   }}
                 />
                 <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#4ade80' : entry.percentage >= 50 ? '#facc15' : '#f87171'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
           ) : (
             <div className="h-64 flex items-center justify-center text-gray-400">
               No subjects assigned.
             </div>
           )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col justify-center items-center text-center">
              <span className="text-4xl font-extrabold text-indigo-600 mb-2">
                {stats.reduce((acc, curr) => acc + curr.attendedCount, 0)}
              </span>
              <span className="text-sm font-medium text-indigo-800">Total Classes Attended</span>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-center items-center text-center">
              <span className="text-4xl font-extrabold text-gray-800 mb-2">
                {stats.reduce((acc, curr) => acc + curr.totalClasses, 0)}
              </span>
              <span className="text-sm font-medium text-gray-500">Total Sessions Conducted</span>
           </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Subject-wise Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Attended / Total</th>
                <th className="px-6 py-3">Percentage</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.map((sub, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {sub.fullName} <span className="text-gray-400 text-xs ml-1">{sub.subjectName}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {sub.attendedCount} / {sub.totalClasses}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-gray-700">
                    {sub.percentage}%
                  </td>
                  <td className="px-6 py-4">
                    {sub.percentage >= 75 ? (
                      <span className="flex items-center text-green-600 text-xs font-bold uppercase tracking-wide">
                        <CheckCircle size={14} className="mr-1" /> Good
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-bold uppercase tracking-wide">
                        <XCircle size={14} className="mr-1" /> Low
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No assigned subjects found for this student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;