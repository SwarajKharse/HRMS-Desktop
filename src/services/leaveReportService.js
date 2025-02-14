import axios from "axios"
import { format } from "date-fns"

const BASE_URL = `${process.env.REACT_APP_API_URL}/leave-report`

export const leaveReportService = {
  getDailyLeaveStatus: async (date) => {
    try{
      const formattedDate = format(date, "yyyy-MM-dd")
      const response = await axios.get(`${BASE_URL}/daily-leave-status?date=${formattedDate}`)
      return response.data
    }catch(err){
      console.error(err)
    }
  },

  getResourceAvailability: async (orgId, startDate, endDate) => {
    const formattedStartDate = format(startDate, "yyyy-MM-dd")
    const formattedEndDate = format(endDate, "yyyy-MM-dd")
    const response = await axios.get(`${BASE_URL}/resource-report`, {
      params: {
        orgId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      },
    })
    return response.data
  },
}

