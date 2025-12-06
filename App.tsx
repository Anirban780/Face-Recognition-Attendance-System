import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminFaculty } from './pages/AdminFaculty';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { StudentPortal } from './pages/StudentPortal';
import { Kiosk } from './pages/Kiosk';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if trying to access unauthorized page
    if (user.role === UserRole.ADMIN) return <Navigate to="/admin" replace />;
    if (user.role === UserRole.FACULTY) return <Navigate to="/faculty" replace />;
    if (user.role === UserRole.STUDENT) return <Navigate to="/student" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<Navigate to="/admin/students" replace />} />
      <Route 
        path="/admin/students" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/faculties" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminFaculty />
          </ProtectedRoute>
        } 
      />

      {/* Faculty Routes */}
      <Route 
        path="/faculty/*" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.FACULTY]}>
            <FacultyDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Student Routes */}
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentPortal />
          </ProtectedRoute>
        } 
      />

      {/* Kiosk Route (Admin removed, only Faculty or authorized) */}
      <Route 
        path="/kiosk" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.FACULTY]}>
            <Kiosk />
          </ProtectedRoute>
        } 
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;