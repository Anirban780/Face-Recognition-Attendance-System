import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LogOut, User as UserIcon, Shield, GraduationCap, MonitorPlay, ScanFace } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { currentUser, logout } = useApp();

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <MonitorPlay className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FaceAttend</span>
          </div>
          
          <div className="flex items-center space-x-4">
            
            {/* Global Kiosk Button */}
            <button 
              onClick={() => onNavigate('kiosk')}
              className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
              title="Enter Kiosk Mode"
            >
              <ScanFace size={18} className="mr-2" />
              <span className="font-semibold text-sm">Give Attendance</span>
            </button>

            {currentUser ? (
              <>
                <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full hidden md:flex">
                  {currentUser.role === UserRole.STUDENT && <UserIcon size={16} className="text-blue-500" />}
                  {currentUser.role === UserRole.FACULTY && <GraduationCap size={16} className="text-green-500" />}
                  {currentUser.role === UserRole.ADMIN && <Shield size={16} className="text-purple-500" />}
                  <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                </div>
                
                {currentUser.role === UserRole.FACULTY && (
                   <button 
                     onClick={() => onNavigate('faculty')}
                     className={`text-sm font-medium hidden sm:block ${currentPage === 'faculty' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                   >
                     Dashboard
                   </button>
                )}
                
                {currentUser.role === UserRole.STUDENT && (
                   <button 
                     onClick={() => onNavigate('student')}
                     className={`text-sm font-medium hidden sm:block ${currentPage === 'student' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                   >
                     My Attendance
                   </button>
                )}

                {currentUser.role === UserRole.ADMIN && (
                   <button 
                     onClick={() => onNavigate('admin')}
                     className={`text-sm font-medium hidden sm:block ${currentPage === 'admin' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                   >
                     Training
                   </button>
                )}

                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              // Not logged in state
              null
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;