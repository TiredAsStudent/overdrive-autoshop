import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "./components/ui/Toast";

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        {/* Global UI Overlays */}
        <ToastContainer />

        {/* Main Application Routes */}
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
