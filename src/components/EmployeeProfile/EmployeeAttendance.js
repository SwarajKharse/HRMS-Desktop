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

// Updated status colors and types to match the previous example
const STATUS_CONFIG = {
  Present: {
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Present",
  },
  Absent: {
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Absent",
  },
  "Late Check-in": {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    label: "Late Check-in",
  },
  "Early Check-out": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Early Check-out",
  },
  "Late Check-in and Early Check-out": {
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Late In & Early Out",
  },
  "Paid Leave": {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Paid Leave",
  },
  "Unpaid Leave": {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    label: "Unpaid Leave",
  },
  Weekend: {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    label: "Weekend",
  },
}

function AttendanceDetailsModal({ date, attendance, onClose, employeeId, onUpdate }) {
  const [checkIn, setCheckIn] = useState(attendance?.checkIn || "")
  const [checkOut, setCheckOut] = useState(attendance?.checkOut || "")
  const [updating, setUpdating] = useState(false)

  const isLeaveStatus = attendance?.status === "Paid Leave" || attendance?.status === "Unpaid Leave"

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      await attendanceService.updateAttendance({
        employee: { id: employeeId },
        date: format(date, "yyyy-MM-dd"),
        checkIn,
        checkOut,
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
          <h3 className="text-lg font-semibold">Attendance Details - {format(date, "dd/MM/yyyy")}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[attendance?.status]?.color || "bg-gray-100 text-gray-800"}`}
            >
              {attendance?.status || "Not Available"}
            </div>
          </div>
          {!isLeaveStatus && (
            <>
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
            </>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {!isLeaveStatus && (
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function EmployeeAttendance({ employeeId }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusSummary, setStatusSummary] = useState({})

  const calculateStatusSummary = (data) => {
    const summary = Object.keys(STATUS_CONFIG).reduce((acc, status) => {
      acc[status] = 0
      return acc
    }, {})

    data.forEach((item) => {
      if (item.status) {
        summary[item.status] = (summary[item.status] || 0) + 1
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

  const getAttendanceStatus = (date) => {
    if (!isSameMonth(date, currentDate)) return null

    const dayData = attendanceData.find((item) => isSameDay(new Date(item.date), date))

    if (dayData) return dayData.status
    if (isSunday(date)) return "Weekend"
    return isPast(date) ? "Absent" : null
  }

  const getStatusColor = (status) => {
    return STATUS_CONFIG[status]?.color || "bg-gray-50 text-gray-400 border-gray-200"
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
        <h3 className="text-lg font-semibold mb-3">Monthly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusSummary).map(
            ([status, count]) =>
              count > 0 && (
                <div
                  key={status}
                  className={`rounded-lg p-3 flex items-center justify-between ${getStatusColor(status)}`}
                >
                  <span className="font-medium">{STATUS_CONFIG[status]?.label || status}</span>
                  <span className="text-lg font-bold">{count}</span>
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
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${config.color.split(" ")[0]} border ${config.color.split(" ")[2]}`}
                />
                <span>{config.label}</span>
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
            const isFutureDate = !isPast(date)
            const attendanceRecord = attendanceData.find((item) => isSameDay(new Date(item.date), date))

            return (
              <motion.div
                key={index}
                className={`relative bg-white min-h-[60px] p-1 cursor-pointer ${
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
                    ${getStatusColor(status)}
                    ${isCurrentDay ? "ring-1 ring-blue-500" : ""}
                  `}
                >
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-medium ${!isCurrentMonth ? "text-gray-400" : "text-gray-900"}`}>
                      {format(date, "d")}
                    </span>
                    {/* Show check-in/out times or upcoming status */}
                    {isSameDay(date, hoveredDate) && (
                      <div className="mt-1 text-[10px] text-center">
                        {isFutureDate && attendanceRecord?.status?.includes("Leave") ? (
                          <div className="text-gray-600 font-medium">Upcoming {attendanceRecord.status}</div>
                        ) : attendanceRecord ? (
                          <>
                            <div>In: {attendanceRecord.checkIn || "N/A"}</div>
                            <div>Out: {attendanceRecord.checkOut || "N/A"}</div>
                          </>
                        ) : (
                          <div>No Data</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Attendance Details Modal */}
      <AnimatePresence>
        {selectedDate && (
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