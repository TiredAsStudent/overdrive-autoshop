import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Icons for the placeholders
import { 
  LayoutDashboard, CheckSquare, Wrench, Package, CircleDollarSign, 
  Users2, Settings2, Home, FileText, Camera, Inbox, UserCircle,
  BarChart3, Truck, History
} from 'lucide-react';

// Layouts & Wrappers
import DashboardLayout from '../components/layout/DashboardLayout';
import PageWrapper from '../components/layout/PageWrapper';

// Actual Pages
import LoginPage from '../pages/auth/LoginPage'; 
import UserProfilePage from '../pages/profile/UserProfilePage';
import AccountSettingsPage from '../pages/settings/AccountSettingsPage';
import PlaceholderPage from '../pages/PlaceholderPage';


import OcrIntake from '../pages/staff/OcrIntake';
import Workshop from '../pages/staff/Workshop';
import WorkshopCheckIn from '../pages/staff/WorkshopCheckIn';
import Estimates from '../pages/staff/Estimates';
import SalesOrders from '../pages/staff/SalesOrders';
import Invoices from '../pages/staff/Invoices';
import OcrHistory from '../pages/staff/OcrHistory';
import StockRoom from '../pages/staff/StockRoom';
import MovementRequests from '../pages/staff/MovementRequest';
import CustomerDirectory from '../pages/staff/CustomerDirectory';
import ServicePassport from '../pages/staff/ServicePassport';
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
// NEW: Import the Staff Dashboard we just built!
import StaffDashboard from '../pages/staff/StaffDashboard';
import AdminOverview from '../pages/admin/AdminOverview';

const AnimatedDashboardRoutes = ({ user }) => { // <--- ADD THIS
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        
        {/* Shared Top Right Menu Routes */}
        <Route path="/profile" element={<PageWrapper><UserProfilePage /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><AccountSettingsPage /></PageWrapper>} />

        {/* === ADMIN PORTAL === */}
        {/* In AnimatedDashboardRoutes, find the admin dashboard route */}
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

        {/* === STAFF PORTAL === */}
        {/* REPLACED WITH REAL COMPONENT */}
        <Route path="/staff/dashboard/stats" element={<PageWrapper><StaffDashboard /></PageWrapper>} />
        <Route path="/staff/dashboard/actions" element={<PageWrapper><PlaceholderPage title="Quick Actions" icon={Home} /></PageWrapper>} />
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

        <Route path="/admin" element={<Navigate to="/admin/dashboard/overview" replace />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard/stats" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const currentUser = { 
    name: 'Jay Agustin', 
    role: 'admin', 
    assigned_branch: 'Batino Branch' 
  };

  return (
    <Router>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/*" element={
          <DashboardLayout user={currentUser}>
            <AnimatedDashboardRoutes user={currentUser} /> 
          </DashboardLayout>
        } />
      </Routes>
    </Router>
  );
};

export default AppRoutes;