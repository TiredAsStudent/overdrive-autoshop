import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import PageWrapper from "../components/layout/PageWrapper";

// --- AUTH PAGES ---
import LoginPage from "../pages/auth/LoginPage";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ActivateAccount from "../pages/auth/ActivateAccount";

// --- ERROR PAGES ---
import AccessDenied from "../pages/error/AccessDenied";
import NotFound from "../pages/error/NotFound";

// --- SHARED PAGES ---
import UserProfilePage from "../pages/profile/UserProfilePage";
import AccountSettingsPage from "../pages/settings/AccountSettingsPage";

// --- STAFF PAGES ---

// --- SYS ADMIN PAGES ---
import Overview from "../pages/sysadmin/Overview";
import Branches from "../pages/sysadmin/Branches";
import Users from "../pages/sysadmin/Users";
import BusinessSettings from "../pages/sysadmin/BusinessSettings";
import AuditLogs from "../pages/sysadmin/AuditLogs";
import SystemHealth from "../pages/sysadmin/SystemHealth";

// --- MANAGER PAGES ---

const AnimatedDashboardRoutes = ({ user }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* === SHARED === */}
        <Route
          path="/profile"
          element={
            <PageWrapper>
              <UserProfilePage />
            </PageWrapper>
          }
        />
        <Route
          path="/settings"
          element={
            <PageWrapper>
              <AccountSettingsPage />
            </PageWrapper>
          }
        />

        {/* === SYS ADMIN === */}
        <Route
          path="/sysadmin/*"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Routes>
                <Route
                  path="overview"
                  element={
                    <PageWrapper>
                      <Overview />
                    </PageWrapper>
                  }
                />
                <Route
                  path="management/branches"
                  element={
                    <PageWrapper>
                      <Branches />
                    </PageWrapper>
                  }
                />
                <Route
                  path="management/users"
                  element={
                    <PageWrapper>
                      <Users />
                    </PageWrapper>
                  }
                />
                <Route
                  path="settings/business"
                  element={
                    <PageWrapper>
                      <BusinessSettings />
                    </PageWrapper>
                  }
                />
                <Route
                  path="records/audit"
                  element={
                    <PageWrapper>
                      <AuditLogs />
                    </PageWrapper>
                  }
                />
                <Route
                  path="records/health"
                  element={
                    <PageWrapper>
                      <SystemHealth />
                    </PageWrapper>
                  }
                />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* === MANAGER === */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <Routes></Routes>
            </ProtectedRoute>
          }
        />

        {/* === STAFF === */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={["STAFF"]}>
              <Routes></Routes>
            </ProtectedRoute>
          }
        />

        {/* REDIRECTS INSIDE THE LAYOUT */}
        <Route
          path="/sysadmin"
          element={<Navigate to="/sysadmin/overview" replace />}
        />
        <Route path="/manager" element={<Navigate to="" replace />} />
        <Route path="/staff" element={<Navigate to="" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  const getDashboardRoute = (role) => {
    switch (role) {
      case "ADMIN":
        return "/sysadmin/overview";
      case "MANAGER":
        return "";
      case "STAFF":
      default:
        return "";
    }
  };

  return (
    <Router>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getDashboardRoute(user.role)} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/activate"
          element={user ? <Navigate to="/" replace /> : <ActivateAccount />}
        />

        {/* ERROR ROUTE */}
        <Route path="/403" element={<AccessDenied user={user} />} />

        {/* WRAPPED DASHBOARD ROUTES */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout user={user}>
                <AnimatedDashboardRoutes user={user} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ROOT REDIRECT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 CATCH-ALL */}
        <Route path="*" element={<NotFound user={user} />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
