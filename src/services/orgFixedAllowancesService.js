import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/fixed-allowances`;

export const orgFixedAllowancesService = {
    
    // Create a new FixedAllowance
    create: async (fixedAllowance, orgId) => {
        try{
            const response = await axios.post(`${BASE_URL}/org/${orgId}`, fixedAllowance)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
    
    // Fetch all fixed allowances for a given organization
    getAll: async (orgId) => {
        try{
            const response = await axios.get(`${BASE_URL}/org?orgId=${orgId}`)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
    
    // Update an existing FixedAllowance
    update: async (id, fixedAllowance) => {
        try{
            const response = await axios.put(`${BASE_URL}/${id}`, fixedAllowance)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
    
    // Delete a FixedAllowance
    delete: async (id) => {
        try{
            const response = await axios.delete(`${BASE_URL}/${id}`)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
        
}