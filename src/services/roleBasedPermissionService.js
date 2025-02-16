import axios from "axios";

const BASE_URL = `${process.env.REACT_APP_API_URL}/permission`;

export const roleBasedPermissionService = {
        
    createPermission: async (permission) => {
        try {
            const response = await axios.post(`${BASE_URL}/`, permission);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error creating permission");
        }
    },

    updatePermission: async (permission) => {
        try {
            console.log(permission);
            const response = await axios.put(`${BASE_URL}/`, permission);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error updating permission");
        }
    },

    getByEmployeeId: async (employeeId) => {
        try {
            const response = await axios.get(`${BASE_URL}/emp/${employeeId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching permissions");
        }
    },

    getByOrgId: async (orgId) => {
        try {
            const response = await axios.get(`${BASE_URL}/org/${orgId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching permissions");
        }
    },

    allowAllPermissions: async (employeeId) => {
        try {
            const response = await axios.put(`${BASE_URL}/allowAll/${employeeId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error allowing all permissions");
        }
    },

    removeAllPermissions: async (employeeId) => {
        try {
            const response = await axios.put(`${BASE_URL}/removeAll/${employeeId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error Removing all permissions");
        }
    },

    resetPermissions: async (employeeId) => {
        try {
            const response = await axios.put(`${BASE_URL}/reset/${employeeId}`);
            return response.data;
        } catch (error) {
            console.log(error);
            throw new Error(error.response?.data?.message || "Error resetting permissions");
        }
    },
};