import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AttendanceRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd use the logged in user's ID/Enrollment
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAttendanceHistory('CS2023001'); // Mock ID
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const presentCount = history.filter(h => h.status === 'Present').length;
  const percentage = history.length > 0 ? Math.round((presentCount / history.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-500">Computer Science Engineering • Sem 5</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                <span className="block text-xs text-green-600 font-semibold uppercase">Attendance</span>
                <span className="text-xl font-bold text-green-700">{percentage}%</span>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <span className="block text-xs text-blue-600 font-semibold uppercase">Total Classes</span>
                <span className="text-xl font-bold text-blue-700">{history.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No records found.</td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {record.date} <span className="text-gray-400 mx-1">|</span> {record.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === 'Present' ? (
                        <span className="flex items-center text-green-700 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Present
                        </span>
                      ) : (
                        <span className="flex items-center text-red-700 text-sm font-medium">
                          <XCircle className="w-4 h-4 mr-1.5" /> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};