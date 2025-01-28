import axios from "axios"

const BASE_URL = "http://localhost:8080/api"

export const leaveHistoryService = {
    getLeaveHistory: async (employeeId) => {
        try {
            const response = await axios.get(`${BASE_URL}/leave-history/employee/${employeeId}`)
            return response.data
        } catch (error) {
            throw new Error("Failed to fetch leave history")
        }
    },
}

