import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show a blank screen or a loading spinner while checking local storage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Verifying access...</p>
      </div>
    );
  }

  // If no user is found, send them straight to the login page
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // If roles are defined but the user's role isn't in the allowed list, boot them
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/workshop" replace />;
    if (user.role === 'customer') return <Navigate to="/customer/tracker" replace />;
    
    // Fallback
    return <Navigate to="/auth/login" replace />;
  }

  // If they pass all checks, render the child route
  return <Outlet />;
};

export default ProtectedRoute;