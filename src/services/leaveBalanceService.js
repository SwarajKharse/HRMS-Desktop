import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/leave-balance`;

export const leaveBalanceService = {
    getLeaveTypesByEmpId: async (empId, month, year) => {
        try {
            const response = await axios.get(`${BASE_URL}/employee/${empId}`,{
                params: { month, year }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getLeaveBalances: async (orgId, month, year) => {
        try {
            const response = await axios.get(`${BASE_URL}/org/${orgId}`, {
                params: { month, year }
            })
            return response.data
        } catch (error) {
            throw new Error("Failed to fetch leave balances")
        }
    },
}