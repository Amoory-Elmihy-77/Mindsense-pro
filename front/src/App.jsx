import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/useAuthStore";
import useGameStore from "./store/useGameStore";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Verify from "./pages/Verify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EmotionTracker from "./pages/EmotionTracker";
import EmotionHistory from "./pages/EmotionHistory";
import Analytics from "./pages/Analytics";
import Contacts from "./pages/Contacts";
import Games from "./pages/Games";
import FlutterDashboard from "./pages/FlutterDashboard";
import VoiceCompanion from "./pages/VoiceCompanion";
import Community from "./pages/Community";
import ProfessionalMarketplace from "./pages/ProfessionalMarketplace";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import MySessions from "./pages/MySessions";

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div
      className="flex-col w-full h-screen overflow-hidden"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Topbar />
      <main className="main-content flex-1">{children}</main>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If roles are specified and user's role isn't among them, redirect appropriately
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === "professional") {
      return <Navigate to="/professional-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const { getMe, isAuthenticated, user } = useAuthStore();
  const { initForUser, clearSession } = useGameStore();

  // Fetch the user profile whenever authentication state is established
  useEffect(() => {
    if (isAuthenticated) {
      getMe();
    }
  }, [getMe, isAuthenticated]);

  // Sync the game store with the currently authenticated user.
  // initForUser() is idempotent — it only re-hydrates when the userId changes.
  useEffect(() => {
    if (user?._id) {
      initForUser(user._id);
    } else {
      // User logged out — wipe in-memory state (localStorage data is kept safe)
      clearSession();
    }
  }, [user?._id, initForUser, clearSession]);

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
            <ProtectedRoute allowedRoles={["user", "admin"]}>
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
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <EmotionTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <EmotionHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Games />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companion"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <VoiceCompanion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute allowedRoles={["user", "premium", "admin", "community_moderator"]}>
              <Community />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flutter-dashboard"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <FlutterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <ProfessionalMarketplace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-sessions"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <MySessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional-dashboard"
          element={
            <ProtectedRoute allowedRoles={["professional", "admin"]}>
              <ProfessionalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? user?.role === "professional"
                    ? "/professional-dashboard"
                    : "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
