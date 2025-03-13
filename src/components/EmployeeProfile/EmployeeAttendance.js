import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
  isSunday,
  getMonth,
  getYear,
} from "date-fns"
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi"
import { attendanceService } from "../../services/attendanceService"
import { holidayService } from "../../services/holidayService"
import { authService } from "../../services/authService"

// Simplified status configuration with fewer categories but clear indicators
const STATUS_CONFIG = {
  Present: {
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Present",
  },
  Absent: {
    color: "bg-red-400 text-red-800 border-red-500",
    label: "Absent",
  },
  "Half Day": {
    color: "bg-amber-200 text-amber-900 border-amber-300",
    label: "Half Day",
  },
  "Paid Leave": {
    color: "bg-purple-300 text-purple-800 border-purple-400",
    label: "Paid Leave",
  },
  "Unpaid Leave": {
    color: "bg-blue-300 text-blue-800 border-blue-400",
    label: "Unpaid Leave",
  },
  Weekend: {
    color: "bg-teal-100 text-teal-800 border-teal-200",
    label: "Weekend",
  },
  Holiday: {
    color: "bg-pink-300 text-pink-900 border-pink-400",
    label: "Holiday",
  },
  "No Data": {
    color: "bg-gray-200 text-gray-800 border-gray-300",
    label: "No Data",
  },
}

// Status indicators for attendance issues
const STATUS_INDICATORS = {
  "Late Check-in": {
    code: "LC",
    color: "bg-orange-500 text-white",
  },
  "Early Check-out": {
    code: "EC",
    color: "bg-yellow-500 text-white",
  },
  "Late Check-in and Early Check-out": {
    code: "LCE",
    color: "bg-orange-600 text-white",
  },
}

// Helper: Return color classes based on status and record data.
const getStatusColor = (status, record) => {
  // For attendance issues, use the Present color but add an indicator badge
  if (status === "Late Check-in" || status === "Early Check-out" || status === "Late Check-in and Early Check-out") {
    return STATUS_CONFIG["Present"].color
  }

  if (status === "Overtime") {
    return "bg-indigo-100 text-indigo-800 border-indigo-200"
  }

  if (status === "Half Day" && record && record.isHalfDayPaid) {
    return "bg-gradient-to-r from-amber-200 to-blue-200 text-blue-900 border-blue-300"
  }

  return STATUS_CONFIG[status]?.color || "bg-gray-50 text-gray-400 border-gray-200"
}

// Helper: Get the appropriate status indicator for attendance issues
const getStatusIndicator = (status) => {
  return STATUS_INDICATORS[status] || null
}

// Helper: Map original status to display status for summary
const mapToDisplayStatus = (originalStatus) => {
  if (
    originalStatus === "Late Check-in" ||
    originalStatus === "Early Check-out" ||
    originalStatus === "Late Check-in and Early Check-out"
  ) {
    return "Present"
  }
  return originalStatus
}

function AttendanceDetailsModal({ date, attendance, onClose, employeeId, onUpdate }) {
  const [checkIn, setCheckIn] = useState(attendance?.checkIn || "")
  const [checkOut, setCheckOut] = useState(attendance?.checkOut || "")
  const [isHalfDay, setIsHalfDay] = useState(attendance?.isHalfDay || false)
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      await attendanceService.updateAttendance({
        employee: { id: employeeId },
        date: format(date, "yyyy-MM-dd"),
        checkIn,
        checkOut,
        isHalfDay,
      })
      onUpdate()
      onClose()
    } catch (error) {
      console.error("Failed to update attendance:", error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold">Attendance Details - {format(date, "dd/MM/yyyy")}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_CONFIG[attendance?.status]?.color ||
                (STATUS_INDICATORS[attendance?.status] ? STATUS_CONFIG["Present"].color : "bg-gray-100 text-gray-800")
              }`}
            >
              {attendance?.status ? (
                STATUS_INDICATORS[attendance?.status] ? (
                  <>Present ({STATUS_INDICATORS[attendance?.status].code})</>
                ) : (
                  STATUS_CONFIG[attendance?.status]?.label || attendance?.status
                )
              ) : (
                "Not Available"
              )}
            </div>
          </div>
          <div>
            <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
              Check In Time
            </label>
            <input
              type="time"
              id="checkIn"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
              Check Out Time
            </label>
            <input
              type="time"
              id="checkOut"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function EmployeeAttendance({ employeeId }) {
  const [currentDate, setCurrentDate] = useState(new Date(new Date().setDate(new Date().getDate() - 10)))
  const [hoveredDate, setHoveredDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusSummary, setStatusSummary] = useState({})
  const [holidays, setHolidays] = useState([])
  const [user] = useState(authService.getUser())

  const calculateStatusSummary = (data) => {
    // Initialize with the simplified status categories
    const summary = Object.keys(STATUS_CONFIG).reduce((acc, status) => {
      acc[status] = 0
      return acc
    }, {})

    // Count statuses, mapping attendance issues to "Present" but keeping track of them
    data.forEach((item) => {
      if (item.status) {
        const displayStatus = mapToDisplayStatus(item.status)
        summary[displayStatus] = (summary[displayStatus] || 0) + 1
      }
    })

    setStatusSummary(summary)
  }

  const fetchMonthlyAttendance = async (date) => {
    try {
      setLoading(true)
      const data = await attendanceService.getMonthlyAttendance(employeeId, getMonth(date), getYear(date))
      setAttendanceData(data)
      calculateStatusSummary(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const data = await holidayService.getHolidaysByYear(user.orgId, getYear(currentDate))
        setHolidays(data)
      } catch (err) {
        console.error("Error fetching holidays:", err)
      }
    }
    fetchHolidays()
    fetchMonthlyAttendance(currentDate)
  }, [currentDate, employeeId])

  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })

  const startingDayIndex = startDate.getDay()
  const totalDays = daysInMonth.length
  const totalCells = Math.ceil((totalDays + startingDayIndex) / 7) * 7

  const calendarDays = Array.from({ length: totalCells }).map((_, index) => {
    const dayOffset = index - startingDayIndex
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + dayOffset)
    return date
  })

  // Modified: If no attendance record exists for a past date, return "No Data"
  const getAttendanceStatus = (date) => {
    if (!isSameMonth(date, currentDate)) return null
    const holiday = holidays.find((h) => isSameDay(new Date(h.date), date))
    if (holiday) return "Holiday"
    const dayData = attendanceData.find((item) => isSameDay(new Date(item.date), date))
    if (dayData) return dayData.status
    if (isSunday(date)) return "Weekend"
    return isPast(date) ? "No Data" : null
  }

  const handleDateClick = (date) => {
    if (!isSameMonth(date, currentDate)) return
    setSelectedDate(date)
  }

  const getSelectedDateAttendance = () => {
    if (!selectedDate) return null
    return attendanceData.find((item) => isSameDay(new Date(item.date), selectedDate))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-white rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-white rounded-lg">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold mb-3">Monthly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusSummary).map(
            ([status, count]) =>
              count > 0 && (
                <div
                  key={status}
                  className={`rounded-lg p-3 flex items-center justify-between ${STATUS_CONFIG[status]?.color || "bg-gray-100 text-gray-800"}`}
                >
                  <span className="font-medium">{STATUS_CONFIG[status]?.label || status}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              ),
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4">
        {/* Calendar Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-4">
          <div className="flex items-center space-x-12">
            <button
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
            <button
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Main status legend */}
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${config.color.split(" ")[0]} border ${config.color.split(" ")[2]}`}
                />
                <span>{config.label}</span>
              </div>
            ))}
            {/* Attendance issue indicators */}
            {Object.entries(STATUS_INDICATORS).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`px-1 text-[10px] rounded ${config.color}`}>{config.code}</div>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div key={index} className="bg-gray-50 p-1 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
          {/* Calendar Days */}
          {calendarDays.map((date, index) => {
            const status = getAttendanceStatus(date)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isCurrentDay = isToday(date)
            const attendanceRecord = attendanceData.find((item) => isSameDay(new Date(item.date), date))
            const statusColor = getStatusColor(status, attendanceRecord)
            const statusIndicator = getStatusIndicator(status)

            return (
              <motion.div
                key={index}
                className={`relative bg-white min-h-[90px] p-1 cursor-pointer ${
                  !isCurrentMonth ? "opacity-50" : "hover:bg-gray-50"
                }`}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => handleDateClick(date)}
                initial={false}
                animate={{
                  scale: isSameDay(date, hoveredDate) ? 0.98 : 1,
                  transition: { duration: 0.1 },
                }}
              >
                <div
                  className={`
                    h-full rounded-md border p-1 transition-colors
                    ${statusColor}
                    ${isCurrentDay ? "ring-1 ring-blue-500" : ""}
                  `}
                >
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-medium ${!isCurrentMonth ? "text-gray-400" : "text-gray-900"}`}>
                      {format(date, "d")}
                    </span>
                    {/* On hover, show check-in/out times */}
                    {isSameDay(date, hoveredDate) && (
                      <div className="mt-1 text-[10px] text-center">
                        {!isPast(date) && attendanceRecord?.status?.includes("Leave") ? (
                          <div className="text-gray-600 font-medium">Upcoming {attendanceRecord.status}</div>
                        ) : attendanceRecord ? (
                          <>
                            <div>In: {attendanceRecord.checkIn || "N/A"}</div>
                            <div>Out: {attendanceRecord.checkOut || "N/A"}</div>
                            {attendanceRecord.overtimeMinutes > 0 && (
                              <div className="text-xs text-indigo-700">OT: {attendanceRecord.overtimeMinutes} min</div>
                            )}
                          </>
                        ) : (
                          <div>No Data</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Indicator Badge (for LC, EC, LCE) */}
                  {statusIndicator && (
                    <div
                      className={`absolute top-1 right-1 ${statusIndicator.color} text-xs px-1 py-0.5 rounded font-medium`}
                    >
                      {statusIndicator.code}
                    </div>
                  )}

                  {/* Overtime Badge */}
                  {attendanceRecord && attendanceRecord.overtimeMinutes > 0 && (
                    <div className="absolute bottom-1 right-1 bg-indigo-600 text-white text-xs px-1 py-0.5 rounded">
                      OT {attendanceRecord.overtimeMinutes}m
                    </div>
                  )}

                  {/* Not Checked Out Badge */}
                  {attendanceRecord && attendanceRecord.checkIn !== null && attendanceRecord.checkOut === null && (
                    <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1 py-0.5 rounded">
                      NCO
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      {/* Attendance Details Modal */}
      <AnimatePresence>
        {selectedDate && user.userId !== employeeId && (
          <AttendanceDetailsModal
            date={selectedDate}
            attendance={getSelectedDateAttendance()}
            onClose={() => setSelectedDate(null)}
            employeeId={employeeId}
            onUpdate={() => fetchMonthlyAttendance(currentDate)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default EmployeeAttendance;