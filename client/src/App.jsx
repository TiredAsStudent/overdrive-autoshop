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
                element={
                  <div className="text-2xl font-bold text-zinc-800">
                    Admin Dashboard Overview (Coming Soon)
                  </div>
                }
              />
              {/* Future Admin Pages will go here, for example: */}
              {/* <Route path="/admin/vehicles" element={<AdminVehicleArchive />} /> */}
              {/* <Route path="/admin/inventory" element={<AdminInventory />} /> */}
            </Route>
          </Route>

          {/* === STAFF PROTECTED ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
            <Route element={<MainLayout />}>
              <Route
                path="/staff"
                element={
                  <div className="text-2xl font-bold text-zinc-800">
                    Staff Operational Dashboard (Coming Soon)
                  </div>
                }
              />
              {/* Future Staff Pages will go here, for example: */}
              {/* <Route path="/staff/vehicles" element={<StaffVehicleSearch />} /> */}
              {/* <Route path="/staff/ocr" element={<StaffOcrIntake />} /> */}
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
