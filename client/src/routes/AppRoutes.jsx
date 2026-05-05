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
import ManagerOverview from "../pages/manager/Overview";
import ManagerExpenseApprovals from "../pages/manager/ExpenseApprovals";
import ManagerStockAdjustment from "../pages/manager/StockAdjustment";
import ManagerRejectionLogs from "../pages/manager/RejectionLogs";
import ManagerServices from "../pages/manager/Services";
import ManagerMechanics from "../pages/manager/Mechanics";
import ManagerStockOverview from "../pages/manager/StockOverview";
import ManagerStockValue from "../pages/manager/StockValue";
import ManagerCOGSTracking from "../pages/manager/COGSTracking";
import ManagerStockTransfers from "../pages/manager/StockTransfers";
import ManagerGeneralLedger from "../pages/manager/GeneralLedger";
import ManagerChartOfAccounts from "../pages/manager/ChartOfAccounts";
import ManagerJournalEntries from "../pages/manager/JournalEntries";
import ManagerTrialBalance from "../pages/manager/TrialBalance";
import ManagerVATLedger from "../pages/manager/VATLedger";
import ManagerIncomeStatement from "../pages/manager/IncomeStatement";
import ManagerBalanceSheet from "../pages/manager/BalanceSheet";
import ManagerCashFlowStatement from "../pages/manager/CashFlowStatement";
import ManagerRevenueReports from "../pages/manager/RevenueReports";
import ManagerExpenseReports from "../pages/manager/ExpenseReports";
import ManagerAccountsPayable from "../pages/manager/AccountsPayable";
import ManagerAccountsReceivable from "../pages/manager/AccountsReceivable";
import ManagerSupplierLedger from "../pages/manager/SupplierLedger";

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
                  path="dashboard/overview"
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
              <Routes>
                <Route
                  path="dashboard/overview"
                  element={
                    <PageWrapper>
                      <ManagerOverview />
                    </PageWrapper>
                  }
                />
                <Route
                  path="approvals/expense-approvals"
                  element={
                    <PageWrapper>
                      <ManagerExpenseApprovals />
                    </PageWrapper>
                  }
                />
                <Route
                  path="approvals/stock-adjustment"
                  element={
                    <PageWrapper>
                      <ManagerStockAdjustment />
                    </PageWrapper>
                  }
                />

                <Route
                  path="approvals/rejection-logs"
                  element={
                    <PageWrapper>
                      <ManagerRejectionLogs />
                    </PageWrapper>
                  }
                />

                <Route
                  path="workshop/services"
                  element={
                    <PageWrapper>
                      <ManagerServices />
                    </PageWrapper>
                  }
                />

                <Route
                  path="workshop/mechanics"
                  element={
                    <PageWrapper>
                      <ManagerMechanics />
                    </PageWrapper>
                  }
                />

                <Route
                  path="inventory/stock-overview"
                  element={
                    <PageWrapper>
                      <ManagerStockOverview />
                    </PageWrapper>
                  }
                />

                <Route
                  path="inventory/stock-value"
                  element={
                    <PageWrapper>
                      <ManagerStockValue />
                    </PageWrapper>
                  }
                />

                <Route
                  path="inventory/cogs-tracking"
                  element={
                    <PageWrapper>
                      <ManagerCOGSTracking />
                    </PageWrapper>
                  }
                />

                <Route
                  path="inventory/stock-transfers"
                  element={
                    <PageWrapper>
                      <ManagerStockTransfers />
                    </PageWrapper>
                  }
                />

                <Route
                  path="accounting/general-ledger"
                  element={
                    <PageWrapper>
                      <ManagerGeneralLedger />
                    </PageWrapper>
                  }
                />

                <Route
                  path="accounting/chart-of-accounts"
                  element={
                    <PageWrapper>
                      <ManagerChartOfAccounts />
                    </PageWrapper>
                  }
                />

                <Route
                  path="accounting/journal-entries"
                  element={
                    <PageWrapper>
                      <ManagerJournalEntries />
                    </PageWrapper>
                  }
                />

                <Route
                  path="accounting/trial-balance"
                  element={
                    <PageWrapper>
                      <ManagerTrialBalance />
                    </PageWrapper>
                  }
                />

                <Route
                  path="accounting/vat-ledger"
                  element={
                    <PageWrapper>
                      <ManagerVATLedger />
                    </PageWrapper>
                  }
                />

                <Route
                  path="reports/income-statement"
                  element={
                    <PageWrapper>
                      <ManagerIncomeStatement />
                    </PageWrapper>
                  }
                />

                <Route
                  path="reports/balance-sheet"
                  element={
                    <PageWrapper>
                      <ManagerBalanceSheet />
                    </PageWrapper>
                  }
                />

                <Route
                  path="reports/cash-flow-statement"
                  element={
                    <PageWrapper>
                      <ManagerCashFlowStatement />
                    </PageWrapper>
                  }
                />

                <Route
                  path="reports/revenue-reports"
                  element={
                    <PageWrapper>
                      <ManagerRevenueReports />
                    </PageWrapper>
                  }
                />

                <Route
                  path="reports/expense-reports"
                  element={
                    <PageWrapper>
                      <ManagerExpenseReports />
                    </PageWrapper>
                  }
                />

                <Route
                  path="balances/accounts-payable"
                  element={
                    <PageWrapper>
                      <ManagerAccountsPayable />
                    </PageWrapper>
                  }
                />

                <Route
                  path="balances/accounts-receivable"
                  element={
                    <PageWrapper>
                      <ManagerAccountsReceivable />
                    </PageWrapper>
                  }
                />

                <Route
                  path="balances/supplier-ledger"
                  element={
                    <PageWrapper>
                      <ManagerSupplierLedger />
                    </PageWrapper>
                  }
                />
              </Routes>
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
          element={<Navigate to="/sysadmin/dashboard/overview" replace />}
        />
        <Route
          path="/manager"
          element={<Navigate to="/manager/dashboard/overview" replace />}
        />
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
        return "/sysadmin/dashboard/overview";
      case "MANAGER":
        return "/manager/dashboard/overview";
      case "STAFF":
      default:
        return "/staff/overview";
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
