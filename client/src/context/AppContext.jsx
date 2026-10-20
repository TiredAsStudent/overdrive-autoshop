import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [branchContext, setBranchContext] = useState("Batino Branch");
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const activeTimer = toastTimersRef.current.get(id);
    if (activeTimer) {
      clearTimeout(activeTimer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        const timerId = setTimeout(() => {
          removeToast(id);
        }, duration);
        toastTimersRef.current.set(id, timerId);
      }
    },
    [removeToast],
  );

  // Clean up any remaining toast timers on unmount
  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      branchContext,
      setBranchContext,
      toasts,
      showToast,
      removeToast,
    }),
    [branchContext, toasts, showToast, removeToast],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
