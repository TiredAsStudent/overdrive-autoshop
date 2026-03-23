import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Assuming you will create these page files next:
import LoginPage from '../pages/auth/Loginpage';
// import AdminDashboard from '../pages/admin/Dashboard';
// import WorkshopFloor from '../pages/staff/WorkshopFloorPage';
// import LiveTracker from '../pages/customer/LiveTrackerPage';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route path="/auth/login" element={<LoginPage />} />
        
        {/* === ADMIN ROUTES === */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}
          <Route path="/admin/dashboard" element={<div>Admin Dashboard (Protected)</div>} />
        </Route>

        {/* === STAFF ROUTES === */}
        {/* Note: Admins inherit Staff capabilities, so they are allowed here too */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
          {/* <Route path="/staff/workshop" element={<WorkshopFloor />} /> */}
          <Route path="/staff/workshop" element={<div>Staff Workshop Floor (Protected)</div>} />
        </Route>

        {/* === CUSTOMER ROUTES === */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          {/* <Route path="/customer/tracker" element={<LiveTracker />} /> */}
          <Route path="/customer/tracker" element={<div>Customer Tracker (Protected)</div>} />
        </Route>

        {/* === FALLBACK === */}
        {/* Catch any unknown URLs and send them to login */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;