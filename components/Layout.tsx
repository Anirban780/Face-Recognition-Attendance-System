import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  LogOut, 
  Menu, 
  Camera,
  UserCircle
} from 'lucide-react';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Admin Items
  { label: 'Students', icon: Users, path: '/admin/students', roles: [UserRole.ADMIN] },
  { label: 'Faculties', icon: GraduationCap, path: '/admin/faculties', roles: [UserRole.ADMIN] },
  
  // Faculty Items
  { label: 'Dashboard', icon: LayoutDashboard, path: '/faculty', roles: [UserRole.FACULTY] },
  { label: 'Kiosk Mode', icon: Camera, path: '/kiosk', roles: [UserRole.FACULTY] },
  
  // Student Items
  { label: 'My Portal', icon: UserCircle, path: '/student', roles: [UserRole.STUDENT] },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with improved colors */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white transform transition-transform duration-200 ease-in-out shadow-xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
             <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-wide">FaceAuth</span>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-3 mb-8 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'}
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl w-full transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <span className="text-lg font-semibold text-gray-800">FaceAuth Attendance</span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};