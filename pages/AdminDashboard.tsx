import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, CheckCircle, Database, Users, PlusCircle, BookOpen, Trash2, Search } from 'lucide-react';
import { UserRole } from '../types';

const AdminDashboard: React.FC = () => {
  const { users, faceDatabase, trainModel, addUser, addSubject, subjects } = useApp();
  const [activeTab, setActiveTab] = useState<'train' | 'users' | 'subjects'>('train');
  
  // Training State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState('');

  // Add User State
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    enrollmentNo: '',
    password: '',
    role: UserRole.STUDENT,
    semester: 1,
    subjectIds: [] as string[]
  });
  const [userMessage, setUserMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Add Subject State
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [subjectMessage, setSubjectMessage] = useState('');

  const students = users.filter(u => u.role === UserRole.STUDENT);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleTrain = async () => {
    if (selectedStudent && selectedFiles.length > 0) {
      setIsTraining(true);
      await trainModel(selectedStudent, selectedFiles);
      setIsTraining(false);
      setTrainMessage('Model trained successfully with new images.');
      setSelectedFiles([]);
      setTimeout(() => setTrainMessage(''), 3000);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.password) {
      addUser(newUser);
      setNewUser({ 
        name: '', 
        email: '', 
        enrollmentNo: '', 
        password: '', 
        role: UserRole.STUDENT,
        semester: 1,
        subjectIds: []
      });
      setUserMessage('User added successfully.');
      setTimeout(() => setUserMessage(''), 3000);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name && newSubject.code) {
      addSubject(newSubject);
      setNewSubject({ name: '', code: '' });
      setSubjectMessage('Subject added successfully.');
      setTimeout(() => setSubjectMessage(''), 3000);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setNewUser(prev => {
      if (prev.subjectIds.includes(subjectId)) {
        return { ...prev, subjectIds: prev.subjectIds.filter(id => id !== subjectId) };
      } else {
        return { ...prev, subjectIds: [...prev.subjectIds, subjectId] };
      }
    });
  };

  // Filter users for list
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.enrollmentNo && u.enrollmentNo.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Console</h1>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('train')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'train' 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center"><Database size={16} className="mr-2" /> Train Model</div>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'users' 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center"><Users size={16} className="mr-2" /> Manage Users</div>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'subjects' 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center"><BookOpen size={16} className="mr-2" /> Manage Subjects</div>
        </button>
      </div>

      <div className="w-full">
        
        {/* TRAIN MODEL TAB */}
        {activeTab === 'train' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-fade-in">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                    <Database className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Train Face Recognition</h2>
                  <p className="text-sm text-gray-500">Upload images for student face data</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Face Images</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400">PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <p className="mt-2 text-sm text-indigo-600 font-medium">{selectedFiles.length} files selected</p>
                  )}
                </div>

                <button
                  onClick={handleTrain}
                  disabled={!selectedStudent || selectedFiles.length === 0 || isTraining}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                    isTraining || !selectedStudent || selectedFiles.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isTraining ? 'Training Model...' : 'Start Training'}
                </button>

                {trainMessage && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200">
                    <CheckCircle size={18} className="mr-2" />
                    {trainMessage}
                  </div>
                )}
              </div>
            </div>
            
            {/* Training Status Summary */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Status</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {students.map(student => {
                    const data = faceDatabase.find(d => d.studentId === student.id);
                    const isTrained = (data?.imageCount || 0) > 0;
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full" />
                          <div>
                             <div className="text-sm font-medium text-gray-900">{student.name}</div>
                             <div className="text-xs text-gray-500">{student.enrollmentNo}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${isTrained ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isTrained ? `${data?.imageCount} Imgs` : 'No Data'}
                        </span>
                      </div>
                    );
                 })}
               </div>
            </div>
          </div>
        )}

        {/* ADD USERS TAB */}
        {activeTab === 'users' && (
           <div className="space-y-8 animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="flex items-center mb-6">
                 <div className="bg-green-100 p-2 rounded-lg mr-4">
                     <PlusCircle className="text-green-600" size={24} />
                 </div>
                 <div>
                   <h2 className="text-lg font-semibold text-gray-800">Register New User</h2>
                   <p className="text-sm text-gray-500">Add students, faculty, or admins</p>
                 </div>
               </div>

               <form onSubmit={handleAddUser} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                     <input 
                       type="text" 
                       required
                       className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                       value={newUser.name}
                       onChange={e => setNewUser({...newUser, name: e.target.value})}
                       placeholder="John Doe"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                     <input 
                       type="email" 
                       required
                       className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                       value={newUser.email}
                       onChange={e => setNewUser({...newUser, email: e.target.value})}
                       placeholder="john@edu.com"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment / Staff ID</label>
                     <input 
                       type="text" 
                       className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                       value={newUser.enrollmentNo}
                       onChange={e => setNewUser({...newUser, enrollmentNo: e.target.value})}
                       placeholder="e.g. STU001 or FAC005"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Set Password</label>
                     <input 
                       type="password" 
                       required
                       className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                       value={newUser.password}
                       onChange={e => setNewUser({...newUser, password: e.target.value})}
                       placeholder="********"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                      >
                        <option value={UserRole.STUDENT}>Student</option>
                        <option value={UserRole.FACULTY}>Faculty</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                      </select>
                   </div>
                   {newUser.role === UserRole.STUDENT && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                        <input 
                          type="number" 
                          className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                          value={newUser.semester}
                          onChange={e => setNewUser({...newUser, semester: parseInt(e.target.value)})}
                          min={1}
                          max={8}
                        />
                      </div>
                   )}
                 </div>

                 {newUser.role !== UserRole.ADMIN && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Subjects</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-gray-200 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {subjects.map(sub => (
                          <label key={sub.id} className="flex items-center space-x-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={newUser.subjectIds.includes(sub.id)}
                              onChange={() => toggleSubject(sub.id)}
                              className="rounded text-green-600 focus:ring-green-500"
                            />
                            <span>{sub.name} ({sub.code})</span>
                          </label>
                        ))}
                     </div>
                   </div>
                 )}

                 <button
                   type="submit"
                   className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                 >
                   <PlusCircle className="mr-2" size={18} /> Add User
                 </button>

                 {userMessage && (
                   <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200">
                     <CheckCircle size={18} className="mr-2" />
                     {userMessage}
                   </div>
                 )}
               </form>
             </div>

             {/* USERS LIST TABLE */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Users className="mr-2" size={20} /> Registered Users
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Profile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => {
                          return (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${user.role === UserRole.STUDENT ? 'bg-blue-100 text-blue-800' : 
                                    user.role === UserRole.FACULTY ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.enrollmentNo || '-'}</div>
                                {user.role === UserRole.STUDENT && (
                                  <div className="text-xs text-gray-500">Sem: {user.semester}</div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500 flex flex-wrap gap-1">
                                  {user.subjectIds && user.subjectIds.length > 0 ? (
                                    user.subjectIds.map(sid => {
                                      const sub = subjects.find(s => s.id === sid);
                                      return sub ? (
                                        <span key={sid} className="px-2 py-0.5 bg-gray-100 rounded text-xs border border-gray-200">
                                          {sub.code}
                                        </span>
                                      ) : null;
                                    })
                                  ) : (
                                    <span className="text-gray-400 italic">None</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No users found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
           </div>
        )}

        {/* ADD SUBJECTS TAB */}
        {activeTab === 'subjects' && (
           <div className="space-y-8 animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <div className="flex items-center mb-6">
                 <div className="bg-blue-100 p-2 rounded-lg mr-4">
                     <BookOpen className="text-blue-600" size={24} />
                 </div>
                 <div>
                   <h2 className="text-lg font-semibold text-gray-800">Add New Subject</h2>
                   <p className="text-sm text-gray-500">Create course entries for the system</p>
                 </div>
               </div>

               <form onSubmit={handleAddSubject} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                     <input 
                       type="text" 
                       required
                       className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                       value={newSubject.name}
                       onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                       placeholder="Advanced Computer Vision"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                     <input 
                       type="text" 
                       required
                       className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                       value={newSubject.code}
                       onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                       placeholder="CS405"
                     />
                   </div>
                 </div>

                 <button
                   type="submit"
                   className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                 >
                   <PlusCircle className="mr-2" size={18} /> Create Subject
                 </button>

                 {subjectMessage && (
                   <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200">
                     <CheckCircle size={18} className="mr-2" />
                     {subjectMessage}
                   </div>
                 )}
               </form>
             </div>

             {/* SUBJECTS LIST TABLE */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <BookOpen className="mr-2" size={20} /> Subject Inventory
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subjects.length > 0 ? (
                        subjects.map(sub => (
                          <tr key={sub.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                                {sub.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sub.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {sub.id}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                            No subjects found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;