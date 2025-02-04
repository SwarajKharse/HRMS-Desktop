import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/tds-slab';

export const tdsSlabService = {
    
    getTdsSlabsByOrgId: async (orgId) => {
        try {
            const response = await axios.get(`${BASE_URL}/org/${orgId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    createTdsSlab: async (tdsSlab) => {
        try {
            const response = await axios.post(`${BASE_URL}/`, tdsSlab);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateTdsSlab: async (tdsSlab) => {
        try {
            const response = await axios.put(`${BASE_URL}/`, tdsSlab);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    deleteTdsSlab: async (tdsSlabId) => {
        try {
            const response = await axios.delete(`${BASE_URL}/${tdsSlabId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

}