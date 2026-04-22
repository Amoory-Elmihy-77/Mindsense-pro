import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import EmotionTracker from './pages/EmotionTracker';
import EmotionHistory from './pages/EmotionHistory';
import Contacts from './pages/Contacts';

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="flex-col w-full h-screen overflow-hidden" style={{display: 'flex', flexDirection: 'column'}}>
      <Topbar />
      <main className="main-content flex-1">
        {children}
      </main>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
};

function App() {
  const { getMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      getMe();
    }
  }, [getMe, isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/emotion" 
          element={
            <ProtectedRoute>
              <EmotionTracker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <EmotionHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contacts" 
          element={
            <ProtectedRoute>
              <Contacts />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
