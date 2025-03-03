import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { leaveReportService } from "../../services/leaveReportService"
import { attendanceService } from "../../services/attendanceService"
import { FiChevronLeft, FiChevronRight, FiSearch, FiUpload, FiDownload, FiX } from "react-icons/fi"
import { authService } from "../../services/authService"

function ResourceAvailability() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [resourceData, setResourceData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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
  }

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
  }

  useEffect(() => {
    fetchResourceData()
  }, [currentDate])

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
      const month = currentDate.getMonth() + 1 // JavaScript months are 0-based
      const year = currentDate.getFullYear()
      const data = await leaveReportService.getResourceAvailability(authService.getUser().orgId, month, year)
      setResourceData(data)
      setFilteredData(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleExportAttendances = async () => {
    try {
      setIsExporting(true)
      const month = currentDate.getMonth() + 1 // JavaScript months are 0-based
      const year = currentDate.getFullYear()
      const data = await attendanceService.exportAttendances(authService.getUser().orgId, month, year)
      const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `attendance-${format(currentDate, "MMM-yyyy")}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      setShowMigrateDialog(false)
      setSuccessMessage("Attendance data exported successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError("Failed to export attendance data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportAttendances = async (file) => {
    try {
      setIsImporting(true)
      await attendanceService.importAttendances(file, authService.getUser().orgId)
      setShowMigrateDialog(false)
      setSuccessMessage("Attendance data imported successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
      fetchResourceData() // Refresh the data
    } catch (err) {
      setError("Failed to import attendance data")
    } finally {
      setIsImporting(false)
    }
  }

  // Generate array of dates for the current month
  const dateRange = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })

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
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 mx-auto w-max"
          >
            <div className="bg-green-50 text-green-600 px-6 py-3 rounded-lg shadow-lg border border-green-100">
              {successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Navigation and Search */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-medium text-gray-900">{format(currentDate, "MMMM yyyy")}</h2>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setShowMigrateDialog(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            Migrate Data
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

      {/* Migration Dialog */}
      <AnimatePresence>
        {showMigrateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowMigrateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-[600px] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Migrate Attendance Data</h2>
                  <p className="text-sm text-gray-500 mt-1">Export or import attendance data</p>
                </div>
                <button
                  onClick={() => setShowMigrateDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Export Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiDownload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Export Data</h3>
                      <p className="text-sm text-gray-500 mb-3">Download attendance data as Excel file</p>
                      <button
                        onClick={handleExportAttendances}
                        disabled={isExporting}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          ${
                            isExporting
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }
                        `}
                      >
                        {isExporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FiDownload className="w-4 h-4 mr-2" />
                            Export Attendance
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Import Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiUpload className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Import Data</h3>
                      <p className="text-sm text-gray-500 mb-3">Upload attendance data from Excel file</p>
                      <label
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          ${
                            isImporting
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                          }
                        `}
                      >
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          disabled={isImporting}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImportAttendances(file)
                            }
                          }}
                        />
                        {isImporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FiUpload className="w-4 h-4 mr-2" />
                            Choose File & Import
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
                  <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                    <li>Export your current data before importing new data</li>
                    <li>Make sure your import file follows the correct format</li>
                    <li>Only .xlsx or .xls files are supported</li>
                    <li>Maximum file size: 5MB</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ResourceAvailability;