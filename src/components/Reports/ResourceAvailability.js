import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format, addMonths, subMonths, eachDayOfInterval } from "date-fns"
import { leaveReportService } from "../../services/leaveReportService"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

function ResourceAvailability() {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState(new Date(new Date()))
  const [resourceData, setResourceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Status color mapping
  const statusColors = {
    Holiday: "bg-blue-100 text-blue-800",
    Weekend: "bg-gray-100 text-gray-600",
    Present: "bg-green-100 text-green-800",
    Absent: "bg-red-100 text-red-800",
    Late: "bg-yellow-100 text-yellow-800",
    "Annual Leave": "bg-purple-100 text-purple-800",
    "Sick Leave": "bg-orange-100 text-orange-800",
    "Casual Leave": "bg-indigo-100 text-indigo-800",
    "Maternity Leave": "bg-rose-100 text-rose-800",
  }

  // Status abbreviations
  const statusAbbreviations = {
    Holiday: "H",
    Weekend: "W",
    Present: "P",
    Absent: "A",
    Late: "L",
    "Annual Leave": "AL",
    "Sick Leave": "SL",
    "Casual Leave": "CL",
    "Maternity Leave": "ML",
  }

  useEffect(() => {
    fetchResourceData()
  }, [startDate, endDate]) // Updated dependency array

  const fetchResourceData = async () => {
    try {
      setLoading(true)
      const data = await leaveReportService.getResourceAvailability(1, startDate, endDate);
      setResourceData(data);
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setStartDate(subMonths(startDate, 1))
    setEndDate(subMonths(endDate, 1))
  }

  const handleNextMonth = () => {
    setStartDate(addMonths(startDate, 1))
    setEndDate(addMonths(endDate, 1))
  }

  // Generate array of dates between start and end date
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 rounded-xl bg-red-50 border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Navigation */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-medium text-gray-900">
          {format(startDate, "dd MMM yyyy")} - {format(endDate, "dd MMM yyyy")}
        </h2>

        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Resource Availability Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Employee
                </th>
                {dateRange.map((date) => (
                  <th
                    key={date.toISOString()}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]"
                  >
                    <div>{format(date, "dd MMM")}</div>
                    <div className="text-gray-400">{format(date, "EEE")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resourceData.map((employee, index) => (
                <motion.tr
                  key={employee.employeeName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                    <div className="flex items-center">
                      {employee.profilePhotoUrl ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                          src={employee.profilePhotoUrl || "/placeholder.svg"}
                          alt={employee.employeeName}
                        />
                      ) : (
                        <span className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-medium text-sm border-2 border-white shadow-sm">
                          {employee.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.employeeName}</div>
                      </div>
                    </div>
                  </td>
                  {employee.dailyStatuses.map((status) => (
                    <td key={status.date} className="px-3 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium ${statusColors[status.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {statusAbbreviations[status.status] || status.status[0]}
                      </span>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusAbbreviations).map(([status, abbr]) => (
            <div key={status} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium ${statusColors[status]}`}
              >
                {abbr}
              </span>
              <span className="text-sm text-gray-600">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ResourceAvailability;