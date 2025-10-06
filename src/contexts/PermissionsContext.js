import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PermissionsContext = createContext(null);

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user) {
        try {
          // Decode the token to get employee id (adjust property name as needed)
          const empId = user.sub; // adjust based on your token payload

          if (empId) {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/permission/emp/${empId}`);;
            localStorage.setItem('userData', JSON.stringify(response.data.employee));
            setPermissions(response.data);
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
        }
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  return (
    <PermissionsContext.Provider value={{ permissions, setPermissions, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Custom hook to use the PermissionsContext
export const usePermissions = () => {
  return useContext(PermissionsContext);
};
