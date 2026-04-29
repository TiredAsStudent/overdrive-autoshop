import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext'; // IMPORT THIS
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <AuthProvider>
      <AppProvider> {/* WRAP EVERYTHING HERE */}
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;