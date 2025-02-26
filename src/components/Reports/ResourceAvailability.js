import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format, addMonths, subMonths, eachDayOfInterval } from "date-fns"
import { leaveReportService } from "../../services/leaveReportService"
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi"
import { authService } from "../../services/authService"

function ResourceAvailability() {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState(new Date(new Date()))
  const [resourceData, setResourceData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Status color mapping
  const statusColors = {
    Holiday: "bg-blue-100 text-blue-800",
    Weekend: "bg-teal-100 text-teal-600",
    Present: "bg-green-100 text-green-800",
    Absent: "bg-red-100 text-red-800",
    "Late Check-in": "bg-yellow-100 text-yellow-800",
    "Early Check-out": "bg-orange-100 text-orange-800",
    "Late Check-in and Early Check-out": "bg-yellow-200 text-yellow-800",
    "Half Day": "bg-amber-100 text-amber-800",
    "Paid Leave": "bg-purple-100 text-purple-800",
    "Unpaid Leave": "bg-orange-100 text-orange-800",
    "-": "bg-gray-100 text-gray-600",
    // Add more leave types if needed
  };

  // Status abbreviations
  const statusAbbreviations = {
    Holiday: "H",
    Weekend: "W",
    Present: "P",
    Absent: "A",
    "Late Check-in": "LC",
    "Early Check-out": "EC",
    "Late Check-in and Early Check-out": "LCE",
    "Half Day": "HD",
    "Paid Leave": "PL",
    "Unpaid Leave": "UL",
    "-": "-",
    // Add more leave types if needed
  };

  useEffect(() => {
    fetchResourceData()
  }, [startDate, endDate]) // Updated dependency array

  // Filter data when search term or resource data changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(resourceData)
    } else {
      const filtered = resourceData.filter((employee) =>
        employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }, [searchTerm, resourceData])

  const fetchResourceData = async () => {
    try {
      setLoading(true)
      const data = await leaveReportService.getResourceAvailability(authService.getUser().orgId, startDate, endDate);
      setResourceData(data);
      setFilteredData(data) // Initialize filtered data with all data
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
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
    <div className="flex flex-col gap-6 h-[calc(100vh-200px)] relative">
      {/* Date Range Navigation and Search */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
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

        {/* Search Bar */}
        <div className="relative w-[300px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full shadow-sm"
          />
        </div>
      </div>

      {/* Resource Availability Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-grow">
        <div className="overflow-auto h-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 shadow-sm">
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
              {filteredData.length > 0 ? (
                filteredData.map((employee, index) => (
                  <motion.tr
                    key={employee.employeeName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 shadow-sm">
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
                ))
              ) : (
                <tr>
                  <td colSpan={dateRange.length + 1} className="px-6 py-4 text-center text-gray-500">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend - Fixed at bottom */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky bottom-0 z-20">
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