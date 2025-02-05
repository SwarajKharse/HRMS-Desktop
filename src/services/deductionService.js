import axios from "axios";

const BASE_URL = "http://localhost:8080/api/deduction";

export const deductionService = {

    createDeduction: async (deduction) => {
        try {
            const response = await axios.post(`${BASE_URL}/`, deduction);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error creating deduction");
        }
    },

    updateDeduction: async (deduction) => {
        try {
            const response = await axios.put(`${BASE_URL}/`, deduction);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error updating deduction");
        }
    },

    getByEmployeeIdAndDate: async (employeeId, startDate, endDate) => {
        try {
            const response = await axios.get(`${BASE_URL}/employee/${employeeId}/startdate/${startDate}/enddate/${endDate}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching deductions");
        }
    },

    deleteDeduction: async (deductionId) => {
        try {
            const response = await axios.delete(`${BASE_URL}/${deductionId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error deleting deduction");
        }
    },

};
