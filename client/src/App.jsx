import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import CustomToaster from "./components/ui/CustomToaster";

import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import VehicleArchive from "./pages/vehicles/VehicleArchive";
import OCRIntake from "./pages/ocr/OCRIntake";
import InventoryList from "./pages/inventory/InventoryList";

// Reusable Placeholder Component for testing routes
const ComingSoon = ({ title }) => (
  <div className="text-2xl font-bold text-zinc-800 p-4">
    {title} (Coming Soon)
  </div>
);

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

          {/* === ADMIN PROTECTED ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<MainLayout />}>
              <Route
                path="/admin"
                element={<ComingSoon title="Admin Dashboard Overview" />}
              />
              <Route path="/admin/vehicles" element={<VehicleArchive />} />
              <Route
                path="/admin/jobs"
                element={<ComingSoon title="Admin Job Cards" />}
              />
              <Route path="/admin/inventory" element={<InventoryList />} />
              <Route path="/admin/ocr" element={<OCRIntake />} />
              <Route
                path="/admin/financials"
                element={<ComingSoon title="Financials & P&L" />}
              />
              <Route
                path="/admin/branches"
                element={<ComingSoon title="Branch Control" />}
              />
              <Route
                path="/admin/audit"
                element={<ComingSoon title="System Audit Logs" />}
              />
              <Route
                path="/admin/users"
                element={<ComingSoon title="Manage Users" />}
              />
              <Route
                path="/admin/settings"
                element={<ComingSoon title="System Settings" />}
              />
            </Route>
          </Route>

          {/* === STAFF PROTECTED ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
            <Route element={<MainLayout />}>
              <Route
                path="/staff"
                element={<ComingSoon title="Staff Operational Dashboard" />}
              />
              <Route path="/staff/vehicles" element={<VehicleArchive />} />
              <Route
                path="/staff/jobs"
                element={<ComingSoon title="Staff Job Cards" />}
              />
              <Route path="/staff/inventory" element={<InventoryList />} />
              <Route path="/staff/ocr" element={<OCRIntake />} />
            </Route>
          </Route>

          {/* Not Found Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
