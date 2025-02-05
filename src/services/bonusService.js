import axios from "axios";

const BASE_URL = "http://localhost:8080/api/bonus";

export const bonusService = {
    
    createBonus: async (bonus) => {
        try {
            const response = await axios.post(`${BASE_URL}/`, bonus);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error creating bonus");
        }
    },

    updateBonus: async (bonus) => {
        try {
            const response = await axios.put(`${BASE_URL}/`, bonus);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error updating bonus");
        }
    },

    getByEmployeeIdAndDate: async (employeeId, startDate, endDate) => {
        try {
            const response = await axios.get(`${BASE_URL}/employee/${employeeId}/startdate/${startDate}/enddate/${endDate}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching bonuses");
        }
    },

    deleteBonus: async (bonusId) => {
        try {
            const response = await axios.delete(`${BASE_URL}/${bonusId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error deleting bonus");
        }
    },

};