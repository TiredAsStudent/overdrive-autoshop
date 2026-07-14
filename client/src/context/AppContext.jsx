import React, { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [branchContext, setBranchContext] = useState("Batino Branch");

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

  return (
    <AppContext.Provider
      value={{
        branchContext,
        setBranchContext,
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
