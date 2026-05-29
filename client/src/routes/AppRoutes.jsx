import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import PageWrapper from "../components/layout/PageWrapper";

// --- AUTH & ERROR PAGES ---
import LoginPage from "../pages/auth/Loginpage";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ActivateAccount from "../pages/auth/ActivateAccount";
import AccessDenied from "../pages/error/AccessDenied";
import NotFound from "../pages/error/NotFound";

// --- SHARED PAGES ---
const UserProfilePage = lazy(() => import("../pages/profile/UserProfilePage"));
const AccountSettingsPage = lazy(
  () => import("../pages/settings/AccountSettingsPage"),
);

// --- STAFF PAGES ---
const StaffOverview = lazy(() => import("../pages/staff/Overview"));
const StaffEstimates = lazy(() => import("../pages/staff/Estimates"));
const StaffSalesOrders = lazy(() => import("../pages/staff/SalesOrders"));
const StaffInvoices = lazy(() => import("../pages/staff/Invoices"));
const StaffPaymentsPostings = lazy(
  () => import("../pages/staff/PaymentsPostings"),
);
const StaffSalesHistory = lazy(() => import("../pages/staff/SalesHistory"));
const StaffReceiptScanning = lazy(
  () => import("../pages/staff/ReceiptScanning"),
);
const StaffSubmissionStatus = lazy(
  () => import("../pages/staff/SubmissionStatus"),
);
const StaffExpenseHistory = lazy(() => import("../pages/staff/ExpenseHistory"));
const StaffStockInventory = lazy(() => import("../pages/staff/StockInventory"));
const StaffStockAdjustments = lazy(
  () => import("../pages/staff/StockAdjustments"),
);
const StaffStockTransfers = lazy(() => import("../pages/staff/StockTransfers"));

// --- SYS ADMIN PAGES ---
const AdminOverview = lazy(() => import("../pages/sysadmin/Overview"));
const AdminBranches = lazy(() => import("../pages/sysadmin/Branches"));
const AdminUsers = lazy(() => import("../pages/sysadmin/Users"));
const AdminBusinessSettings = lazy(
  () => import("../pages/sysadmin/BusinessSettings"),
);
const AdminAiAssistant = lazy(() => import("../pages/sysadmin/AiAssistant"));
const AdminAuditLogs = lazy(() => import("../pages/sysadmin/AuditLogs"));
const AdminSystemHealth = lazy(() => import("../pages/sysadmin/SystemHealth"));

// --- MANAGER PAGES ---
const ManagerOverview = lazy(() => import("../pages/manager/Overview"));
const ManagerExpenseApprovals = lazy(
  () => import("../pages/manager/ExpenseApprovals"),
);
const ManagerStockAdjustment = lazy(
  () => import("../pages/manager/StockAdjustment"),
);
const ManagerRejectionLogs = lazy(
  () => import("../pages/manager/RejectionLogs"),
);
const ManagerServices = lazy(() => import("../pages/manager/Services"));
const ManagerMechanics = lazy(() => import("../pages/manager/Mechanics"));
const ManagerStockOverview = lazy(
  () => import("../pages/manager/StockOverview"),
);
const ManagerStockValue = lazy(() => import("../pages/manager/StockValue"));
const ManagerCOGSTracking = lazy(() => import("../pages/manager/COGSTracking"));
const ManagerStockTransfers = lazy(
  () => import("../pages/manager/StockTransfers"),
);
const ManagerGeneralLedger = lazy(
  () => import("../pages/manager/GeneralLedger"),
);
const ManagerChartOfAccounts = lazy(
  () => import("../pages/manager/ChartOfAccounts"),
);
const ManagerJournalEntries = lazy(
  () => import("../pages/manager/JournalEntries"),
);
const ManagerTrialBalance = lazy(() => import("../pages/manager/TrialBalance"));
const ManagerVATLedger = lazy(() => import("../pages/manager/VATLedger"));
const ManagerIncomeStatement = lazy(
  () => import("../pages/manager/IncomeStatement"),
);
const ManagerBalanceSheet = lazy(() => import("../pages/manager/BalanceSheet"));
const ManagerCashFlowStatement = lazy(
  () => import("../pages/manager/CashFlowStatement"),
);
const ManagerRevenueReports = lazy(
  () => import("../pages/manager/RevenueReports"),
);
const ManagerExpenseReports = lazy(
  () => import("../pages/manager/ExpenseReports"),
);
const ManagerAccountsPayable = lazy(
  () => import("../pages/manager/AccountsPayable"),
);
const ManagerAccountsReceivable = lazy(
  () => import("../pages/manager/AccountsReceivable"),
);
const ManagerSupplierLedger = lazy(
  () => import("../pages/manager/SupplierLedger"),
);

// Loading Spinner
const PageLoader = () => (
  <div className="flex h-[80vh] w-full items-center justify-center">
    <div className="flex flex-col items-center space-y-5">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-slate-200 dark:border-overdrive-card rounded-full"></div>
        <div className="absolute inset-0 border-4 border-overdrive-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide animate-pulse">
        Loading module...
      </p>
    </div>
  </div>
);

const LocationBasedRoutes = ({ user }) => {
  const location = useLocation();

  const getDashboardRoute = (role) => {
    switch (role) {
      case "ADMIN":
        return "/sysadmin/dashboard/overview";
      case "MANAGER":
        return "/manager/dashboard/overview";
      case "STAFF":
      default:
        return "/staff/dashboard/overview";
    }
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
        <Route path="/403" element={<AccessDenied user={user} />} />

        {/* Dedicated standalone 404 Route outside the layout block */}
        <Route path="/404" element={<NotFound user={user} />} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* =========================================================
             THE SECURE PORTAL NETWORKS
        ========================================================= */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout user={user}>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        >
          {/* SHARED */}
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

          {/* SYSADMIN */}
          <Route
            path="/sysadmin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="dashboard/overview" replace />}
            />
            <Route
              path="dashboard/overview"
              element={
                <PageWrapper>
                  <AdminOverview />
                </PageWrapper>
              }
            />
            <Route
              path="management/branches-registry"
              element={
                <PageWrapper>
                  <AdminBranches />
                </PageWrapper>
              }
            />
            <Route
              path="management/users-accounts"
              element={
                <PageWrapper>
                  <AdminUsers />
                </PageWrapper>
              }
            />
            <Route
              path="settings/business-logic"
              element={
                <PageWrapper>
                  <AdminBusinessSettings />
                </PageWrapper>
              }
            />
            <Route
              path="settings/ai-assistant"
              element={
                <PageWrapper>
                  <AdminAiAssistant />
                </PageWrapper>
              }
            />
            <Route
              path="records/audit-trail"
              element={
                <PageWrapper>
                  <AdminAuditLogs />
                </PageWrapper>
              }
            />
            <Route
              path="records/system-health"
              element={
                <PageWrapper>
                  <AdminSystemHealth />
                </PageWrapper>
              }
            />

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>

          {/* MANAGER */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["MANAGER"]}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="dashboard/overview" replace />}
            />
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

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>

          {/* STAFF */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={["STAFF"]}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="dashboard/overview" replace />}
            />
            <Route
              path="dashboard/overview"
              element={
                <PageWrapper>
                  <StaffOverview />
                </PageWrapper>
              }
            />
            <Route
              path="sales/estimates"
              element={
                <PageWrapper>
                  <StaffEstimates />
                </PageWrapper>
              }
            />
            <Route
              path="sales/sales-orders"
              element={
                <PageWrapper>
                  <StaffSalesOrders />
                </PageWrapper>
              }
            />
            <Route
              path="sales/invoices"
              element={
                <PageWrapper>
                  <StaffInvoices />
                </PageWrapper>
              }
            />
            <Route
              path="sales/payments-postings"
              element={
                <PageWrapper>
                  <StaffPaymentsPostings />
                </PageWrapper>
              }
            />
            <Route
              path="sales/sales-history"
              element={
                <PageWrapper>
                  <StaffSalesHistory />
                </PageWrapper>
              }
            />
            <Route
              path="expenses/receipt-scanning"
              element={
                <PageWrapper>
                  <StaffReceiptScanning />
                </PageWrapper>
              }
            />
            <Route
              path="expenses/submission-status"
              element={
                <PageWrapper>
                  <StaffSubmissionStatus />
                </PageWrapper>
              }
            />
            <Route
              path="expenses/expense-history"
              element={
                <PageWrapper>
                  <StaffExpenseHistory />
                </PageWrapper>
              }
            />
            <Route
              path="inventory/stock-inventory"
              element={
                <PageWrapper>
                  <StaffStockInventory />
                </PageWrapper>
              }
            />
            <Route
              path="inventory/stock-adjustments"
              element={
                <PageWrapper>
                  <StaffStockAdjustments />
                </PageWrapper>
              }
            />
            <Route
              path="inventory/stock-transfers"
              element={
                <PageWrapper>
                  <StaffStockTransfers />
                </PageWrapper>
              }
            />

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Router>
      <LocationBasedRoutes user={user} />
    </Router>
  );
};

export default AppRoutes;
