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
import StaffDashboard from "../pages/staff/StaffDashboard";
import OcrIntake from "../pages/staff/OcrIntake";
import OcrHistory from "../pages/staff/OcrHistory";
import Workshop from "../pages/staff/Workshop";
import WorkshopCheckIn from "../pages/staff/WorkshopCheckIn";
import Estimates from "../pages/staff/Estimates";
import SalesOrders from "../pages/staff/SalesOrders";
import Invoices from "../pages/staff/Invoices";
import StockRoom from "../pages/staff/StockRoom";
import MovementRequests from "../pages/staff/MovementRequest";
import CustomerDirectory from "../pages/staff/CustomerDirectory";
import ServicePassport from "../pages/staff/ServicePassport";

// --- SYS ADMIN PAGES ---
import Overview from "../pages/sysadmin/Overview";
import Branches from "../pages/sysadmin/Branches";
import Users from "../pages/sysadmin/Users";
import BusinessSettings from "../pages/sysadmin/BusinessSettings";
import Integrations from "../pages/sysadmin/Integrations";
import AuditLogs from "../pages/sysadmin/AuditLogs";
import SystemHealth from "../pages/sysadmin/SystemHealth";

// --- MANAGER PAGES (Imported from the renamed manager folder) ---
import BranchRanking from "../pages/manager/BranchRanking";
import OcrApprovals from "../pages/manager/OcrApprovals";
import StockAdjustments from "../pages/manager/StockAdjustments";
import AdminServices from "../pages/manager/AdminServices";
import MechanicRegistry from "../pages/manager/MechanicRegistry";
import AdminStockOverview from "../pages/manager/AdminStockOverview";
import BulkOrderBuilder from "../pages/manager/BulkOrderBuilder";
import AdminTransfers from "../pages/manager/AdminTransfers";
import AdminAccounts from "../pages/manager/AdminAccounts";
import AdminReports from "../pages/manager/AdminReports";
import AdminTaxes from "../pages/manager/AdminTaxes";
import AdminCustomerDirectory from "../pages/manager/AdminCustomerDirectory";
import AdminServiceHistory from "../pages/manager/AdminServiceHistory";

// --- CUSTOMER PAGES ---
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CustomerInstructions from "../pages/customer/CustomerInstructions";
import CustomerTimeline from "../pages/customer/CustomerTimeline";
import CustomerTechnicalLogs from "../pages/customer/CustomerTechnicalLogs";
import CustomerEstimates from "../pages/customer/CustomerEstimates";
import CustomerInvoices from "../pages/customer/CustomerInvoices";
import CustomerGarage from "../pages/customer/CustomerGarage";

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

        {/* === SYS ADMIN (Strictly IT/Global) === */}
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
                  path="settings/integrations"
                  element={
                    <PageWrapper>
                      <Integrations />
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

        {/* === MANAGER (Enterprise Owner) === */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <Routes>
                <Route
                  path="dashboard/ranking"
                  element={
                    <PageWrapper>
                      <BranchRanking />
                    </PageWrapper>
                  }
                />
                <Route
                  path="approvals/ocr"
                  element={
                    <PageWrapper>
                      <OcrApprovals />
                    </PageWrapper>
                  }
                />
                <Route
                  path="approvals/stock"
                  element={
                    <PageWrapper>
                      <StockAdjustments />
                    </PageWrapper>
                  }
                />
                <Route
                  path="workshop/services"
                  element={
                    <PageWrapper>
                      <AdminServices />
                    </PageWrapper>
                  }
                />
                <Route
                  path="workshop/mechanics"
                  element={
                    <PageWrapper>
                      <MechanicRegistry />
                    </PageWrapper>
                  }
                />
                <Route
                  path="inventory/overview"
                  element={
                    <PageWrapper>
                      <AdminStockOverview />
                    </PageWrapper>
                  }
                />
                <Route
                  path="inventory/bulk"
                  element={
                    <PageWrapper>
                      <BulkOrderBuilder />
                    </PageWrapper>
                  }
                />
                <Route
                  path="inventory/transfers"
                  element={
                    <PageWrapper>
                      <AdminTransfers />
                    </PageWrapper>
                  }
                />
                <Route
                  path="finance/accounts"
                  element={
                    <PageWrapper>
                      <AdminAccounts />
                    </PageWrapper>
                  }
                />
                <Route
                  path="finance/reports"
                  element={
                    <PageWrapper>
                      <AdminReports />
                    </PageWrapper>
                  }
                />
                <Route
                  path="finance/taxes"
                  element={
                    <PageWrapper>
                      <AdminTaxes />
                    </PageWrapper>
                  }
                />
                <Route
                  path="customers/directory"
                  element={
                    <PageWrapper>
                      <AdminCustomerDirectory />
                    </PageWrapper>
                  }
                />
                <Route
                  path="customers/history"
                  element={
                    <PageWrapper>
                      <AdminServiceHistory />
                    </PageWrapper>
                  }
                />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* === STAFF (Daily Operations) === */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={["STAFF"]}>
              <Routes>
                <Route
                  path="dashboard/stats"
                  element={
                    <PageWrapper>
                      <StaffDashboard />
                    </PageWrapper>
                  }
                />
                <Route
                  path="workshop/check-in"
                  element={
                    <PageWrapper>
                      <WorkshopCheckIn />
                    </PageWrapper>
                  }
                />
                <Route
                  path="workshop/kanban"
                  element={
                    <PageWrapper>
                      <Workshop user={user} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="billing/estimates"
                  element={
                    <PageWrapper>
                      <Estimates user={user} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="billing/orders"
                  element={
                    <PageWrapper>
                      <SalesOrders user={user} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="billing/invoices"
                  element={
                    <PageWrapper>
                      <Invoices user={user} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="ocr/new"
                  element={
                    <PageWrapper>
                      <OcrIntake />
                    </PageWrapper>
                  }
                />
                <Route
                  path="ocr/history"
                  element={
                    <PageWrapper>
                      <OcrHistory />
                    </PageWrapper>
                  }
                />
                <Route
                  path="inventory/stock"
                  element={
                    <PageWrapper>
                      <StockRoom user={user} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="inventory/requests"
                  element={
                    <PageWrapper>
                      <MovementRequests user={user} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="customers/directory"
                  element={
                    <PageWrapper>
                      <CustomerDirectory user={user} />
                    </PageWrapper>
                  }
                />
                <Route
                  path="customers/passport"
                  element={
                    <PageWrapper>
                      <ServicePassport user={user} />
                    </PageWrapper>
                  }
                />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* === CUSTOMER (Digital Garage) === */}
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Routes>
                <Route
                  path="dashboard/status"
                  element={
                    <PageWrapper>
                      <CustomerDashboard />
                    </PageWrapper>
                  }
                />
                <Route
                  path="dashboard/instructions"
                  element={
                    <PageWrapper>
                      <CustomerInstructions />
                    </PageWrapper>
                  }
                />
                <Route
                  path="history/timeline"
                  element={
                    <PageWrapper>
                      <CustomerTimeline />
                    </PageWrapper>
                  }
                />
                <Route
                  path="history/logs"
                  element={
                    <PageWrapper>
                      <CustomerTechnicalLogs />
                    </PageWrapper>
                  }
                />
                <Route
                  path="documents/estimates"
                  element={
                    <PageWrapper>
                      <CustomerEstimates />
                    </PageWrapper>
                  }
                />
                <Route
                  path="documents/invoices"
                  element={
                    <PageWrapper>
                      <CustomerInvoices />
                    </PageWrapper>
                  }
                />
                <Route
                  path="garage"
                  element={
                    <PageWrapper>
                      <CustomerGarage />
                    </PageWrapper>
                  }
                />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* REDIRECTS INSIDE THE LAYOUT */}
        <Route
          path="/sysadmin"
          element={<Navigate to="/sysadmin/overview" replace />}
        />
        <Route
          path="/manager"
          element={<Navigate to="/manager/dashboard/ranking" replace />}
        />
        <Route
          path="/staff"
          element={<Navigate to="/staff/dashboard/stats" replace />}
        />
        <Route
          path="/customer"
          element={<Navigate to="/customer/dashboard/status" replace />}
        />
      </Routes>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* 1. LOGIN REDIRECT - Automatically sends returning users to their portal */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "ADMIN"
                    ? "/sysadmin/overview"
                    : user.role === "MANAGER"
                      ? "/manager/dashboard/ranking"
                      : user.role === "STAFF"
                        ? "/staff/dashboard/stats"
                        : "/customer/dashboard/status"
                }
                replace
              />
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

        {/* 2. ERROR ROUTE */}
        <Route path="/403" element={<AccessDenied user={user} />} />

        {/* 3. WRAPPED DASHBOARD ROUTES (Security Check) */}
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

        {/* 4. ROOT REDIRECT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 5. 404 CATCH-ALL */}
        <Route path="*" element={<NotFound user={user} />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
