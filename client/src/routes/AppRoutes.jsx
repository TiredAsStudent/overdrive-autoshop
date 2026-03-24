import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Icons for the placeholders
import { 
  LayoutDashboard, ClipboardList, Search, ScanLine, Package, 
  CheckSquare, BarChart3, Truck, Users, History
} from 'lucide-react';

// Layouts & Protected Routes
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Actual Pages we built
import LoginPage from '../pages/auth/Loginpage';
import UserProfilePage from '../pages/profile/UserProfilePage';
import AccountSettingsPage from '../pages/settings/AccountSettingsPage';

// The Universal Placeholder
import PlaceholderPage from '../pages/PlaceholderPage';

const AppRoutes = () => {
  // Mock User
  const currentUser = { 
    name: 'Jay Agustin', 
    role: 'admin', 
    assigned_branch: 'Batino Branch' 
  };

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTE */}
        <Route path="/auth/login" element={<LoginPage />} />
        
        {/* APP SHELL (Sidebar + Navbar) */}
        <Route element={<DashboardLayout user={currentUser} />}>
          
          {/* Top Right Menu Routes */}
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />

          {/* === WORKSHOP (MAKER) ROUTES === */}
          {/* We will replace this placeholder with the real Kanban Board next! */}
          <Route path="/staff/workshop" element={<PlaceholderPage title="Workshop Floor (Kanban)" subtitle="Drag-and-drop repair pipeline and job tracking." icon={LayoutDashboard} />} />
          <Route path="/check-in" element={<PlaceholderPage title="Vehicle Check-In" subtitle="Register new vehicles and create repair tickets." icon={ClipboardList} />} />
          <Route path="/records" element={<PlaceholderPage title="Medical Records" subtitle="Search historical repair data via License Plate." icon={Search} />} />
          <Route path="/ocr" element={<PlaceholderPage title="OCR Intake Module" subtitle="Scan and digitize vendor receipts automatically." icon={ScanLine} />} />
          <Route path="/inventory" element={<PlaceholderPage title="Local Inventory" subtitle="Manage parts and fluid stocks for this branch." icon={Package} />} />

          {/* === GOVERNANCE (CHECKER) ROUTES === */}
          <Route path="/approvals" element={<PlaceholderPage title="Approval Queue" subtitle="Review pending requests and OCR anomalies." icon={CheckSquare} />} />
          <Route path="/analytics" element={<PlaceholderPage title="Financial Analytics" subtitle="Branch revenue, costs, and performance metrics." icon={BarChart3} />} />
          <Route path="/transfers" element={<PlaceholderPage title="Stock Transfers" subtitle="Logistics and part movements between branches." icon={Truck} />} />
          <Route path="/resources" element={<PlaceholderPage title="Resource Management" subtitle="Manage mechanic schedules and system users." icon={Users} />} />
          <Route path="/audit" element={<PlaceholderPage title="Audit Trail" subtitle="System-wide security and action logs." icon={History} />} />

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/staff/workshop" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;