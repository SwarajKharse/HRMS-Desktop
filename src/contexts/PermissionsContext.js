import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PermissionsContext = createContext(null);

// Page access derived from the employee's designation. // by atharva
function getPageFlagsForDesignation(rawDesig) {
  const desig = (rawDesig || "").toLowerCase().trim();

  const flags = {
    webSettings: false, webOnboarding: false, webReports: false,
    webLeave: false, webAttendance: false, webPayroll: false,
    webAddLeads: false, webLeadsListing: false, webProject: false,
    webStore: false, webPurchase: false, webProductManagement: false,
    webAccounts: false, webFinance: false,
  };

  // Baseline — everyone (Home needs no flag)
  flags.webLeave = true;
  flags.webAttendance = true;
  flags.webAddLeads = true;

  const ACCESS = {
    "managing director":            "ALL",
    "vice president":               "ALL",
    "hr assistant":                 "HR",
    "hr executive":                 "HR",
    "hr manager":                   "HR",
    "accountant":                   "webAccounts",
    "accounts manager":             "webAccounts",
    "finance manager":              "webFinance",
    "project manager":              "webProject",
    "site engineer":                "webProject",
    "purchaser":                    "webPurchase",
    "purchase manager":             "webPurchase",
    "business development manager": "webLeadsListing",
    "sales support engineer":       "webLeadsListing",
    "sales team lead":              "webLeadsListing",
    "techno commercial head":       "webLeadsListing",
    "store incharge":               "webStore",
    "store manager":                "webStore",
    // AMC Engineer, Designer, Driver, Helper, Housekeeping, Welder -> baseline
  };

  const access = ACCESS[desig];

  if (access === "ALL") {
    Object.keys(flags).forEach((k) => { flags[k] = true; });
  } else if (access === "HR") {
    flags.webSettings = true;
    flags.webOnboarding = true;
    flags.webReports = true;
    flags.webPayroll = true;
  } else if (access) {
    flags[access] = true;
  }

  return flags;
}

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, employee } = useAuth(); //added by atharva

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user) {
        try {
          // Decode the token to get employee id (adjust property name as needed)
          const empId = user.sub; // adjust based on your token payload

          if (empId) {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/permission/emp/${empId}`);;
            localStorage.setItem('userData', JSON.stringify(response.data.employee)); // by atharva
            const pageFlags = getPageFlagsForDesignation(employee?.designation?.name); // by atharva
            setPermissions({ ...response.data, ...pageFlags }); // by atharva
          } 
        } catch (error) {
          console.error("Error fetching permissions:", error);
        }
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [user, employee]); // by atharva

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
