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
const StaffCustomers = lazy(() => import("../pages/staff/Customers"));
const StaffEstimates = lazy(() => import("../pages/staff/Estimates"));
const StaffSalesOrders = lazy(() => import("../pages/staff/SalesOrders"));
const StaffInvoices = lazy(() => import("../pages/staff/Invoices"));
const StaffPayments = lazy(() => import("../pages/staff/Payments"));
const StaffExpenses = lazy(() => import("../pages/staff/Expenses"));
const StaffPurchaseOrders = lazy(() => import("../pages/staff/PurchaseOrders"));
const StaffBills = lazy(() => import("../pages/staff/Bills"));
const StaffVendors = lazy(() => import("../pages/staff/Vendors"));
const StaffStockManagement = lazy(
  () => import("../pages/staff/StockManagement"),
);
const StaffStockAdjustments = lazy(
  () => import("../pages/staff/StockAdjustments"),
);
const StaffReceiptScanner = lazy(() => import("../pages/staff/ReceiptScanner"));
const StaffReceiptVerification = lazy(
  () => import("../pages/staff/ReceiptVerification"),
);
const StaffReceiptHistory = lazy(() => import("../pages/staff/ReceiptHistory"));

// --- SYS ADMIN PAGES ---
const AdminOverview = lazy(() => import("../pages/sysadmin/Overview"));
const AdminBranches = lazy(() => import("../pages/sysadmin/Branches"));
const AdminUsers = lazy(() => import("../pages/sysadmin/Users"));
const AdminBusinessSettings = lazy(
  () => import("../pages/sysadmin/BusinessSettings"),
);
const AdminAuditLogs = lazy(() => import("../pages/sysadmin/AuditLogs"));
const AdminDatabaseBackups = lazy(
  () => import("../pages/sysadmin/DatabaseBackups"),
);

// --- MANAGER PAGES ---
const ManagerOverview = lazy(() => import("../pages/manager/Overview"));
const ManagerServiceCatalog = lazy(
  () => import("../pages/manager/ServiceCatalog"),
);
const ManagerStockManagement = lazy(
  () => import("../pages/manager/StockManagement"),
);
const ManagerStockAdjustments = lazy(
  () => import("../pages/manager/StockAdjustments"),
);
const ManagerStockTransfers = lazy(
  () => import("../pages/manager/StockTransfers"),
);
const ManagerExpenseApprovals = lazy(
  () => import("../pages/manager/ExpenseApprovals"),
);
const ManagerPurchaseOrderApprovals = lazy(
  () => import("../pages/manager/PurchaseOrderApprovals"),
);
const ManagerReceiptApprovals = lazy(
  () => import("../pages/manager/ReceiptApprovals"),
);
const ManagerChartOfAccounts = lazy(
  () => import("../pages/manager/ChartOfAccounts"),
);
const ManagerJournalEntries = lazy(
  () => import("../pages/manager/JournalEntries"),
);
const ManagerGeneralLedger = lazy(
  () => import("../pages/manager/GeneralLedger"),
);
const ManagerTrialBalance = lazy(() => import("../pages/manager/TrialBalance"));
const ManagerIncomeStatement = lazy(
  () => import("../pages/manager/IncomeStatement"),
);
const ManagerBalanceSheet = lazy(() => import("../pages/manager/BalanceSheet"));
const ManagerCashFlowStatement = lazy(
  () => import("../pages/manager/CashFlowStatement"),
);
const ManagerExpenseReports = lazy(
  () => import("../pages/manager/ExpenseReports"),
);
const ManagerSalesReports = lazy(() => import("../pages/manager/SalesReports"));
const ManagerInventoryReports = lazy(
  () => import("../pages/manager/InventoryReports"),
);
const ManagerReceivablesReports = lazy(
  () => import("../pages/manager/ReceivablesReports"),
);
const ManagerPayablesReports = lazy(
  () => import("../pages/manager/PayablesReports"),
);
const ManagerTaxVATReports = lazy(
  () => import("../pages/manager/TaxVATReports"),
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
              path="records/audit-trail"
              element={
                <PageWrapper>
                  <AdminAuditLogs />
                </PageWrapper>
              }
            />
            <Route
              path="records/database-backups"
              element={
                <PageWrapper>
                  <AdminDatabaseBackups />
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

            {/* === Dashboard === */}
            <Route
              path="dashboard/overview"
              element={
                <PageWrapper>
                  <ManagerOverview />
                </PageWrapper>
              }
            />

            {/* === Services === */}
            <Route
              path="services/service-catalog"
              element={
                <PageWrapper>
                  <ManagerServiceCatalog />
                </PageWrapper>
              }
            />

            {/* === Inventory === */}
            <Route
              path="inventory/stock-management"
              element={
                <PageWrapper>
                  <ManagerStockManagement />
                </PageWrapper>
              }
            />
            <Route
              path="inventory/stock-adjustments"
              element={
                <PageWrapper>
                  <ManagerStockAdjustments />
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

            {/* === Approvals === */}
            <Route
              path="approvals/expense-approvals"
              element={
                <PageWrapper>
                  <ManagerExpenseApprovals />
                </PageWrapper>
              }
            />
            <Route
              path="approvals/purchase-order-approvals"
              element={
                <PageWrapper>
                  <ManagerPurchaseOrderApprovals />
                </PageWrapper>
              }
            />
            <Route
              path="approvals/receipt-approvals"
              element={
                <PageWrapper>
                  <ManagerReceiptApprovals />
                </PageWrapper>
              }
            />

            {/* === Accounting === */}
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
              path="accounting/general-ledger"
              element={
                <PageWrapper>
                  <ManagerGeneralLedger />
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

            {/* === Reports === */}
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
              path="reports/expense-reports"
              element={
                <PageWrapper>
                  <ManagerExpenseReports />
                </PageWrapper>
              }
            />
            <Route
              path="reports/sales-reports"
              element={
                <PageWrapper>
                  <ManagerSalesReports />
                </PageWrapper>
              }
            />
            <Route
              path="reports/inventory-reports"
              element={
                <PageWrapper>
                  <ManagerInventoryReports />
                </PageWrapper>
              }
            />
            <Route
              path="reports/receivables-reports"
              element={
                <PageWrapper>
                  <ManagerReceivablesReports />
                </PageWrapper>
              }
            />
            <Route
              path="reports/payables-reports"
              element={
                <PageWrapper>
                  <ManagerPayablesReports />
                </PageWrapper>
              }
            />
            <Route
              path="reports/tax-vat-reports"
              element={
                <PageWrapper>
                  <ManagerTaxVATReports />
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

            {/* === Dashboard === */}
            <Route
              path="dashboard/overview"
              element={
                <PageWrapper>
                  <StaffOverview />
                </PageWrapper>
              }
            />

            {/* === Sales === */}
            <Route
              path="sales/customers"
              element={
                <PageWrapper>
                  <StaffCustomers />
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
              path="sales/payments"
              element={
                <PageWrapper>
                  <StaffPayments />
                </PageWrapper>
              }
            />

            {/* === Purchases === */}
            <Route
              path="purchases/expenses"
              element={
                <PageWrapper>
                  <StaffExpenses />
                </PageWrapper>
              }
            />
            <Route
              path="purchases/purchase-orders"
              element={
                <PageWrapper>
                  <StaffPurchaseOrders />
                </PageWrapper>
              }
            />
            <Route
              path="purchases/bills"
              element={
                <PageWrapper>
                  <StaffBills />
                </PageWrapper>
              }
            />
            <Route
              path="purchases/vendors"
              element={
                <PageWrapper>
                  <StaffVendors />
                </PageWrapper>
              }
            />

            {/* === Inventory === */}
            <Route
              path="inventory/stock-management"
              element={
                <PageWrapper>
                  <StaffStockManagement />
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

            {/* === Receipts === */}
            <Route
              path="receipts/receipt-scanner"
              element={
                <PageWrapper>
                  <StaffReceiptScanner />
                </PageWrapper>
              }
            />
            <Route
              path="receipts/verification/:id"
              element={
                <PageWrapper>
                  <StaffReceiptVerification />
                </PageWrapper>
              }
            />
            <Route
              path="receipts/receipt-history"
              element={
                <PageWrapper>
                  <StaffReceiptHistory />
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
