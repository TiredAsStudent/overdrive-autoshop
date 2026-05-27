import React, { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. Current Operation State
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);

  // 2. Branch Context
  const [branchContext, setBranchContext] = useState("Batino Branch");

  // 3. Universal Notification (Toast) State
  const [toasts, setToasts] = useState([]);

  // Toast Functionality
  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);

    setToasts((prev) => [...prev, { id, message, type, duration }]);

    // Auto-dismiss
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Helper to set session
  const setSession = (plate, customer) => {
    setActiveVehicle(plate);
    setActiveCustomer(customer);
  };

  // Helper to clear session
  const clearSession = () => {
    setActiveVehicle(null);
    setActiveCustomer(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeVehicle,
        activeCustomer,
        branchContext,
        setBranchContext,
        setSession,
        clearSession,
        toasts, // Exported toast state
        showToast, // Exported trigger function
        removeToast, // Exported dismiss function
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
