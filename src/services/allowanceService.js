import axios from "axios";

const BASE_URL = `${process.env.REACT_APP_API_URL}/allowance`;

export const allowanceService = {
    
    createAllowance: async (allowance) => {
        try {
            const response = await axios.post(`${BASE_URL}/`, allowance);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error creating allowance");
        }
    },

    updateAllowance: async (allowance) => {
        try {
            const response = await axios.put(`${BASE_URL}/`, allowance);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error updating allowance");
        }
    },

    getByEmployeeIdAndDate: async (employeeId, startDate, endDate) => {
        try {
            const response = await axios.get(`${BASE_URL}/employee/${employeeId}/startdate/${startDate}/enddate/${endDate}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching allowances");
        }
    },

    deleteAllowance: async (allowanceId) => {
        try {
            const response = await axios.delete(`${BASE_URL}/${allowanceId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error deleting allowance");
        }
    },

};