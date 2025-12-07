import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Kiosk from './pages/Kiosk';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'student':
        return <StudentDashboard />;
      case 'faculty':
        return <FacultyDashboard onNavigate={setCurrentPage} />;
      case 'admin':
        return <AdminDashboard />;
      case 'kiosk':
        return <Kiosk onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {currentPage !== 'kiosk' && (
        <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      )}
      <main>
        {renderPage()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;