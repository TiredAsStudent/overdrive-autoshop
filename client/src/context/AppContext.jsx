import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. Current Operation State
  const [activeVehicle, setActiveVehicle] = useState(null); // Stores Plate Number
  const [activeCustomer, setActiveCustomer] = useState(null); // Stores { name, phone, etc. }
  
  // 2. Branch Context
  const [branchContext, setBranchContext] = useState('Batino Branch');

  // Helper to set everything at once during check-in
  const setSession = (plate, customer) => {
    setActiveVehicle(plate);
    setActiveCustomer(customer);
  };

  // Helper to clear the session (e.g., when vehicle is released)
  const clearSession = () => {
    setActiveVehicle(null);
    setActiveCustomer(null);
  };

  return (
    <AppContext.Provider value={{ 
      activeVehicle, 
      activeCustomer, 
      branchContext, 
      setBranchContext,
      setSession,
      clearSession
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);