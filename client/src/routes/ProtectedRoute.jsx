import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Not logged in? Kick them back to the login page.
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but wrong role? Kick them to the Access Denied page.
    return <Navigate to="/403" replace />;
  }

  // If they pass all checks, render the page!
  return children;
};

export default ProtectedRoute;
