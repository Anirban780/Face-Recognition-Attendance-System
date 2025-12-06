import React, { useEffect, useState } from 'react';
import { api, SUBJECTS } from '../services/api';
import { User, Subject } from '../types';
import { Plus, Search, Trash2, Edit2, GraduationCap } from 'lucide-react';

export const AdminFaculty: React.FC = () => {
  const [faculties, setFaculties] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    assignedSubjects: [] as string[]
  });

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFaculties();
      setFaculties(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addFaculty(formData);
      setShowAddModal(false);
      setFormData({ name: '', email: '', assignedSubjects: [] });
      loadFaculties();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleSubject = (code: string) => {
    setFormData(prev => {
      if (prev.assignedSubjects.includes(code)) {
        return { ...prev, assignedSubjects: prev.assignedSubjects.filter(s => s !== code) };
      } else {
        return { ...prev, assignedSubjects: [...prev.assignedSubjects, code] };
      }
    });
  };

  const getSubjectName = (code: string) => SUBJECTS.find(s => s.code === code)?.name || code;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage faculty members and subject assignments.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Faculty
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Subjects</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Loading faculty data...</td>
                </tr>
              ) : faculties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No faculty members found.</td>
                </tr>
              ) : (
                faculties.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                          {faculty.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{faculty.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {faculty.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {faculty.assignedSubjects?.map(code => (
                            <span key={code} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title={getSubjectName(code)}>
                                {code}
                            </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4"><Edit2 className="w-4 h-4" /></button>
                      <button className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Faculty Member</h2>
            <form onSubmit={handleAddFaculty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {SUBJECTS.map(subject => (
                        <label key={subject.code} className="flex items-center space-x-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={formData.assignedSubjects.includes(subject.code)}
                                onChange={() => toggleSubject(subject.code)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>{subject.code} - {subject.name}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};