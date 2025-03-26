import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/basic-da-slab`;

export const orgBasicDaSlabsService = {

    // Create a new BasicDaSlab
    create: async (basicDaSlab, orgId) => {
        try{
            const response = await axios.post(`${BASE_URL}/org/${orgId}`, basicDaSlab)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
    
    // Fetch all slabs using organization ID
    getAll: async (orgId) => {
        try{
            const response = await axios.get(`${BASE_URL}/org?orgId=${orgId}`)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
    
    // Update an existing BasicDaSlab
    update: async (id, basicDaSlab) => {
        try{
            const response = await axios.put(`${BASE_URL}/${id}`, basicDaSlab)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
    
    // Delete a BasicDaSlab
    delete: async (id) => {
        try{
            const response = await axios.delete(`${BASE_URL}/${id}`)
            return response.data;
        }catch(error){
            throw error.response?.data || error.message;
        }
    },
    
}