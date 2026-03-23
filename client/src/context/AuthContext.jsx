import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create a custom hook for easy access later
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for an existing session when the app loads
  useEffect(() => {
    const checkLoggedInUser = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false); // Stop the loading spinner once the check is done
      }
    };

    checkLoggedInUser();
  }, []);

  // The login function to update global state
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  // The logout function to clear global state
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Provide the state and functions to the rest of the app
  const value = {
    user,
    loading,
    login,
    logout,
    // Helper booleans based on your Role-Based Access Control (RBAC)
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isCustomer: user?.role === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};