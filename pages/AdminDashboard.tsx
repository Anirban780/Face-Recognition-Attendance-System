import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Student, Subject } from '../types';
import { Plus, Search, Trash2, Edit2, Upload, BrainCircuit, BookOpen, X, CheckCircle, Loader2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  
  // Training Modal State
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '', enrollmentNo: '', email: '', branch: 'CSE', semester: 1, enrolledSubjects: [] as string[]
  });
  
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '' });
  
  // Image Upload State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadImages, setUploadImages] = useState<FileList | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sts, subs] = await Promise.all([api.getStudents(), api.getSubjects()]);
      setStudents(sts);
      setSubjects(subs);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTrainModel = async () => {
      setShowTrainingModal(true);
      setTrainingProgress(0);
      setTrainingStatus('Initializing...');
      
      // Simulation of training steps
      const steps = [
          { pct: 10, msg: 'Loading dataset...' },
          { pct: 30, msg: 'Preprocessing images...' },
          { pct: 60, msg: 'Generating embeddings...' },
          { pct: 85, msg: 'Optimizing classifier...' },
          { pct: 100, msg: 'Model saved successfully!' }
      ];

      for (const step of steps) {
          await new Promise(r => setTimeout(r, 800));
          setTrainingProgress(step.pct);
          setTrainingStatus(step.msg);
      }
      
      await new Promise(r => setTimeout(r, 1000));
      setShowTrainingModal(false);
      alert("System is now ready for recognition.");
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addStudent(formData);
      setShowAddModal(false);
      setFormData({ name: '', enrollmentNo: '', email: '', branch: 'CSE', semester: 1, enrolledSubjects: [] });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleAddSubject = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.createSubject(subjectForm.code, subjectForm.name);
          setShowSubjectModal(false);
          setSubjectForm({ code: '', name: '' });
          loadData();
      } catch (error) {
          alert('Failed to add subject');
      }
  };
  
  const handleImageUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedStudentId || !uploadImages) return;
      
      try {
          for(let i=0; i<uploadImages.length; i++) {
              const file = uploadImages[i];
              const reader = new FileReader();
              reader.readAsDataURL(file);
              await new Promise(resolve => {
                  reader.onload = async () => {
                       await api.uploadStudentImage(selectedStudentId, reader.result as string);
                       resolve(true);
                  }
              });
          }
          alert("Images uploaded successfully");
          setShowUploadModal(false);
          loadData(); 
      } catch(e) {
          alert("Upload failed");
      }
  };

  const toggleSubject = (code: string) => {
    setFormData(prev => {
      if (prev.enrolledSubjects.includes(code)) {
        return { ...prev, enrolledSubjects: prev.enrolledSubjects.filter(s => s !== code) };
      } else {
        return { ...prev, enrolledSubjects: [...prev.enrolledSubjects, code] };
      }
    });
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage Students, Subjects, and Face Model.</p>
        </div>
        <div className="flex space-x-3">
             <button 
                onClick={handleTrainModel}
                disabled={showTrainingModal}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors disabled:opacity-50"
             >
                <BrainCircuit className="w-4 h-4 mr-2" />
                Train Model
            </button>
            {activeTab === 'students' ? (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </button>
            ) : (
                <button 
                  onClick={() => setShowSubjectModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </button>
            )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`${activeTab === 'students' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Upload className="w-4 h-4 mr-2" /> Students & Enrollment
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`${activeTab === 'subjects' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BookOpen className="w-4 h-4 mr-2" /> Subjects
            </button>
          </nav>
      </div>

      {activeTab === 'students' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or enrollment..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch/Sem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Face Data</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading students...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.enrollmentNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.branch}</div>
                      <div className="text-sm text-gray-500">Sem {student.semester}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.enrolledSubjects.map(code => (
                          <span key={code} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.photoCount >= 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                             {student.photoCount} Samples
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => { setSelectedStudentId(student.id); setShowUploadModal(true); }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        title="Upload Photos"
                      >
                          <Upload className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
      
      {activeTab === 'subjects' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map(sub => (
                        <tr key={sub.code}>
                            <td className="px-6 py-4 font-medium text-gray-900">{sub.code}</td>
                            <td className="px-6 py-4 text-gray-500">{sub.name}</td>
                        </tr>
                    ))}
                </tbody>
              </table>
          </div>
      )}

      {/* Training Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                    <BrainCircuit className="w-8 h-8 text-purple-600 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Training AI Model</h2>
                <p className="text-gray-500 mb-6 text-sm">{trainingStatus}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                    <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${trainingProgress}%` }}
                    ></div>
                </div>
                <p className="text-xs font-bold text-gray-400">{trainingProgress}% Complete</p>
            </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Register New Student</h2>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input required type="text" placeholder="Full Name" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required type="text" placeholder="Enrollment No" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={formData.enrollmentNo} onChange={e => setFormData({...formData, enrollmentNo: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                 <input type="text" placeholder="Branch (e.g. CSE)" className="border border-gray-300 rounded-lg p-2.5" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} />
                 <input type="number" placeholder="Semester" className="border border-gray-300 rounded-lg p-2.5" value={formData.semester} onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})} />
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Assign Subjects</p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {subjects.map(s => (
                        <label key={s.code} className="flex items-center space-x-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input type="checkbox" checked={formData.enrolledSubjects.includes(s.code)} onChange={() => toggleSubject(s.code)} className="rounded text-blue-600 focus:ring-blue-500"/>
                            <span>{s.code}</span>
                        </label>
                    ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Register Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Training Photos</h2>
            <form onSubmit={handleImageUpload} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={e => setUploadImages(e.target.files)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-4">Select 5-10 clear face photos of the student.</p>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                    <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Upload</button>
                </div>
            </form>
          </div>
          </div>
      )}
      
       {/* Subject Modal */}
      {showSubjectModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Subject</h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
                <input required placeholder="Subject Code (e.g. CS101)" className="w-full border border-gray-300 rounded-lg p-2.5" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} />
                <input required placeholder="Subject Name" className="w-full border border-gray-300 rounded-lg p-2.5" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} />
                <div className="flex justify-end space-x-3 mt-4">
                    <button type="button" onClick={() => setShowSubjectModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
                </div>
            </form>
          </div>
          </div>
      )}
    </div>
  );
};