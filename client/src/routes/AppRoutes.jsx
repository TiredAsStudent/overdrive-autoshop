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
        <Route path="/admin/dashboard/ranking" element={<PageWrapper><PlaceholderPage title="Branch Ranking" icon={BarChart3} /></PageWrapper>} />
        <Route path="/admin/approvals/ocr" element={<PageWrapper><PlaceholderPage title="OCR Verifications" icon={CheckSquare} /></PageWrapper>} />
        <Route path="/admin/approvals/stock" element={<PageWrapper><PlaceholderPage title="Stock Adjustments" icon={CheckSquare} /></PageWrapper>} />
        <Route path="/admin/workshop/services" element={<PageWrapper><PlaceholderPage title="Services" icon={Wrench} /></PageWrapper>} />
        <Route path="/admin/workshop/mechanics" element={<PageWrapper><PlaceholderPage title="Mechanics" icon={Wrench} /></PageWrapper>} />
        <Route path="/admin/inventory/overview" element={<PageWrapper><PlaceholderPage title="Stock Overview" icon={Package} /></PageWrapper>} />
        <Route path="/admin/inventory/bulk" element={<PageWrapper><PlaceholderPage title="Bulk Order" icon={Package} /></PageWrapper>} />
        <Route path="/admin/inventory/transfers" element={<PageWrapper><PlaceholderPage title="Stock Transfers" icon={Truck} /></PageWrapper>} />
        <Route path="/admin/finance/accounts" element={<PageWrapper><PlaceholderPage title="Chart of Accounts" icon={CircleDollarSign} /></PageWrapper>} />
        <Route path="/admin/finance/reports" element={<PageWrapper><PlaceholderPage title="Reports" icon={CircleDollarSign} /></PageWrapper>} />
        <Route path="/admin/finance/taxes" element={<PageWrapper><PlaceholderPage title="Taxes" icon={CircleDollarSign} /></PageWrapper>} />
        <Route path="/admin/customers/directory" element={<PageWrapper><PlaceholderPage title="Customer Directory" icon={Users2} /></PageWrapper>} />
        <Route path="/admin/customers/history" element={<PageWrapper><PlaceholderPage title="Service History" icon={History} /></PageWrapper>} />
        <Route path="/admin/control/users" element={<PageWrapper><PlaceholderPage title="User Management" icon={Settings2} /></PageWrapper>} />
        <Route path="/admin/control/settings" element={<PageWrapper><PlaceholderPage title="Settings" icon={Settings2} /></PageWrapper>} />
        <Route path="/admin/control/logs" element={<PageWrapper><PlaceholderPage title="Logs" icon={History} /></PageWrapper>} />

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
    role: 'staff', 
    assigned_branch: 'Batino Branch' 
  };

  return (
    <Router>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/*" element={
          <DashboardLayout user={currentUser}>
            {/* 3. PASS THE USER here so it can reach the sub-routes */}
            <AnimatedDashboardRoutes user={currentUser} /> 
          </DashboardLayout>
        } />
      </Routes>
    </Router>
  );
};

export default AppRoutes;