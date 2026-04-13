import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts & Wrappers
import DashboardLayout from '../components/layout/DashboardLayout';
import PageWrapper from '../components/layout/PageWrapper';

// --- AUTH PAGES (Full Screen) ---
import LoginPage from '../pages/auth/LoginPage'; 
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// --- ERROR PAGES (Full Screen) ---
import AccessDenied from '../pages/error/AccessDenied';
import NotFound from '../pages/error/NotFound';

// --- SHARED PAGES (With Sidebar) ---
import UserProfilePage from '../pages/profile/UserProfilePage';
import AccountSettingsPage from '../pages/settings/AccountSettingsPage';

// --- STAFF PAGES (With Sidebar) ---
import StaffDashboard from '../pages/staff/StaffDashboard';
import OcrIntake from '../pages/staff/OcrIntake';
import OcrHistory from '../pages/staff/OcrHistory';
import Workshop from '../pages/staff/Workshop';
import WorkshopCheckIn from '../pages/staff/WorkshopCheckIn';
import Estimates from '../pages/staff/Estimates';
import SalesOrders from '../pages/staff/SalesOrders';
import Invoices from '../pages/staff/Invoices';
import StockRoom from '../pages/staff/StockRoom';
import MovementRequests from '../pages/staff/MovementRequest';
import CustomerDirectory from '../pages/staff/CustomerDirectory';
import ServicePassport from '../pages/staff/ServicePassport';

// --- ADMIN PAGES (With Sidebar) ---
import AdminOverview from '../pages/admin/AdminOverview';
import BranchRanking from '../pages/admin/BranchRanking';
import OcrApprovals from '../pages/admin/OcrApprovals';
import StockAdjustments from '../pages/admin/StockAdjustments';
import AdminServices from '../pages/admin/AdminServices';
import MechanicRegistry from '../pages/admin/MechanicRegistry';
import AdminStockOverview from '../pages/admin/AdminStockOverview';
import BulkOrderBuilder from '../pages/admin/BulkOrderBuilder';
import AdminTransfers from '../pages/admin/AdminTransfers';
import AdminAccounts from '../pages/admin/AdminAccounts';
import AdminReports from '../pages/admin/AdminReports';
import AdminTaxes from '../pages/admin/AdminTaxes';
import AdminCustomerDirectory from '../pages/admin/AdminCustomerDirectory';
import AdminServiceHistory from '../pages/admin/AdminServiceHistory';
import AdminUserManagement from '../pages/admin/AdminUserManagement';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminActivityLogs from '../pages/admin/AdminActivityLogs';

// --- CUSTOMER PAGES (With Sidebar) ---
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import CustomerInstructions from '../pages/customer/CustomerInstructions';
import CustomerTimeline from '../pages/customer/CustomerTimeline';
import CustomerTechnicalLogs from '../pages/customer/CustomerTechnicalLogs';
import CustomerEstimates from '../pages/customer/CustomerEstimates';
import CustomerInvoices from '../pages/customer/CustomerInvoices';
import CustomerGarage from '../pages/customer/CustomerGarage';

const AnimatedDashboardRoutes = ({ user }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        
        {/* SHARED */}
        <Route path="/profile" element={<PageWrapper><UserProfilePage /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><AccountSettingsPage /></PageWrapper>} />

        {/* === ADMIN === */}
        <Route path="/admin/dashboard/overview" element={<PageWrapper><AdminOverview /></PageWrapper>} />
        <Route path="/admin/dashboard/ranking" element={<PageWrapper><BranchRanking /></PageWrapper>} />
        <Route path="/admin/approvals/ocr" element={<PageWrapper><OcrApprovals /></PageWrapper>} />
        <Route path="/admin/approvals/stock" element={<PageWrapper><StockAdjustments /></PageWrapper>} />
        <Route path="/admin/workshop/services" element={<PageWrapper><AdminServices /></PageWrapper>} />
        <Route path="/admin/workshop/mechanics" element={<PageWrapper><MechanicRegistry /></PageWrapper>} />
        <Route path="/admin/inventory/overview" element={<PageWrapper><AdminStockOverview /></PageWrapper>} />
        <Route path="/admin/inventory/bulk" element={<PageWrapper><BulkOrderBuilder /></PageWrapper>} />
        <Route path="/admin/inventory/transfers" element={<PageWrapper><AdminTransfers /></PageWrapper>} />
        <Route path="/admin/finance/accounts" element={<PageWrapper><AdminAccounts /></PageWrapper>} />
        <Route path="/admin/finance/reports" element={<PageWrapper><AdminReports /></PageWrapper>} />
        <Route path="/admin/finance/taxes" element={<PageWrapper><AdminTaxes /></PageWrapper>} />
        <Route path="/admin/customers/directory" element={<PageWrapper><AdminCustomerDirectory /></PageWrapper>} />
        <Route path="/admin/customers/history" element={<PageWrapper><AdminServiceHistory /></PageWrapper>} />
        <Route path="/admin/control/users" element={<PageWrapper><AdminUserManagement /></PageWrapper>} />
        <Route path="/admin/control/settings" element={<PageWrapper><AdminSettings /></PageWrapper>} />
        <Route path="/admin/control/logs" element={<PageWrapper><AdminActivityLogs /></PageWrapper>} />

        {/* === STAFF === */}
        <Route path="/staff/dashboard/stats" element={<PageWrapper><StaffDashboard /></PageWrapper>} />
        <Route path="/staff/workshop/check-in" element={<PageWrapper><WorkshopCheckIn /></PageWrapper>} />
        <Route path="/staff/workshop/kanban" element={<PageWrapper><Workshop user={user} /></PageWrapper>} />
        <Route path="/staff/billing/estimates" element={<PageWrapper><Estimates user={user} /></PageWrapper>} />
        <Route path="/staff/billing/orders" element={<PageWrapper><SalesOrders user={user} /></PageWrapper>} />
        <Route path="/staff/billing/invoices" element={<PageWrapper><Invoices user={user} /></PageWrapper>} />
        <Route path="/staff/ocr/new" element={<PageWrapper><OcrIntake /></PageWrapper>} />
        <Route path="/staff/ocr/history" element={<PageWrapper><OcrHistory /></PageWrapper>} />
        <Route path="/staff/inventory/stock" element={<PageWrapper><StockRoom user={user} /></PageWrapper>} />
        <Route path="/staff/inventory/requests" element={<PageWrapper><MovementRequests user={user} /></PageWrapper>} />
        <Route path="/staff/customers/directory" element={<PageWrapper><CustomerDirectory user={user} /></PageWrapper>} />
        <Route path="/staff/customers/passport" element={<PageWrapper><ServicePassport user={user} /></PageWrapper>} />

        {/* === CUSTOMER === */}
        <Route path="/customer/dashboard/status" element={<PageWrapper><CustomerDashboard /></PageWrapper>} />
        <Route path="/customer/dashboard/instructions" element={<PageWrapper><CustomerInstructions /></PageWrapper>} />
        <Route path="/customer/history/timeline" element={<PageWrapper><CustomerTimeline /></PageWrapper>} />
        <Route path="/customer/history/logs" element={<PageWrapper><CustomerTechnicalLogs /></PageWrapper>} />
        <Route path="/customer/documents/estimates" element={<PageWrapper><CustomerEstimates /></PageWrapper>} />
        <Route path="/customer/documents/invoices" element={<PageWrapper><CustomerInvoices /></PageWrapper>} />
        <Route path="/customer/garage" element={<PageWrapper><CustomerGarage /></PageWrapper>} />

        {/* REDIRECTS INSIDE THE LAYOUT */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard/overview" replace />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard/stats" replace />} />
        <Route path="/customer" element={<Navigate to="/customer/dashboard/status" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const currentUser = { 
    name: 'Jayro Agustin', 
    role: 'admin', 
    assigned_branch: 'Batino Branch',
    plate: 'ABC 1234' 
  };

  return (
    <Router>
      <Routes>
        {/* 1. FULL SCREEN AUTH ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* 2. FULL SCREEN ERROR ROUTES (Removed sidebar by being top-level) */}
        <Route path="/403" element={<AccessDenied user={currentUser} />} />

        {/* 3. WRAPPED DASHBOARD ROUTES (Includes Sidebar) */}
        <Route path="/*" element={
          <DashboardLayout user={currentUser}>
            <AnimatedDashboardRoutes user={currentUser} /> 
          </DashboardLayout>
        } />

        {/* 4. ROOT REDIRECT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 5. FULL SCREEN 404 CATCH-ALL (Outside the DashboardLayout) */}
        <Route path="*" element={<NotFound user={currentUser} />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;