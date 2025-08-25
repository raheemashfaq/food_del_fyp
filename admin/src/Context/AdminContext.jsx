import React, { createContext, useState, useEffect } from 'react';

export const AdminContext = createContext();

const AdminContextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [adminData, setAdminData] = useState(null);
  const url = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Save token to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('adminToken', token);
    } else {
      localStorage.removeItem('adminToken');
    }
  }, [token]);

  const contextValue = {
    url,
    token,
    setToken,
    adminData,
    setAdminData,
    logout: () => {
      setToken('');
      setAdminData(null);
      localStorage.removeItem('adminToken');
    }
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;