import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import CustomToaster from "./components/ui/CustomToaster";

import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <CustomToaster />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route
              path="/admin"
              element={
                <div className="p-10 text-2xl font-bold">
                  Admin Dashboard (Coming Soon)
                </div>
              }
            />
          </Route>

          {/* Staff Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
            <Route
              path="/staff"
              element={
                <div className="p-10 text-2xl font-bold">
                  Staff Dashboard (Coming Soon)
                </div>
              }
            />
          </Route>

          {/* Not Found Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
