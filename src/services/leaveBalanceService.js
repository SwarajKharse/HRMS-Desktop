import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/leave-balance`;

export const leaveBalanceService = {
    getLeaveTypesByEmpId: async (empId) => {
        try {
            const response = await axios.get(`${BASE_URL}/employee/${empId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getLeaveBalances: async (orgId) => {
        try {
            const response = await axios.get(`${BASE_URL}/org/${orgId}`)
            return response.data
        } catch (error) {
            throw new Error("Failed to fetch leave balances")
        }
    },
}