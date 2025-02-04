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

function AttendanceDetailsModal({ date, attendance, onClose, employeeId, onUpdate }) {
  const [checkIn, setCheckIn] = useState(attendance?.checkIn || "")
  const [checkOut, setCheckOut] = useState(attendance?.checkOut || "")
  const [updating, setUpdating] = useState(false)

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
          <h3 className="text-lg font-semibold">
            Attendance Details - {format(date, "dd/MM/yyyy")}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium
              ${
                attendance?.status === "Present"
                  ? "bg-green-100 text-green-800"
                  : attendance?.status === "Late Check-in"
                  ? "bg-orange-100 text-orange-800"
                  : attendance?.status === "Early Check-out"
                  ? "bg-purple-100 text-purple-800"
                  : attendance?.status === "Late Check-in and Early Check-out"
                  ? "bg-red-100 text-red-800"
                  : attendance?.status === "Absent"
                  ? "bg-blue-100 text-blue-800"
                  : attendance?.status === "Weekend"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-white text-gray-800"
              }`}
            >
              {attendance?.status || "Not Available"}
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMonthlyAttendance = async (date) => {
    try {
      setLoading(true)
      const data = await attendanceService.getMonthlyAttendance(
        employeeId,
        getMonth(date),
        getYear(date)
      )
      setAttendanceData(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthlyAttendance(currentDate)
  }, [currentDate]) // employeeId is assumed not to change

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
    if (!isPast(date) || !isSameMonth(date, currentDate)) return null
    if (isSunday(date)) return "Weekend"
    const dayData = attendanceData.find((item) => isSameDay(new Date(item.date), date))
    if (dayData) return dayData.status
    return "Absent"
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800 border-green-200"
      case "Late Check-in":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Early Check-out":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Late Check-in and Early Check-out":
        return "bg-red-100 text-red-800 border-red-200"
      case "Absent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Weekend":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-white text-gray-400 border-gray-200"
    }
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
    <div className="bg-white rounded-lg p-4 relative">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
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

        {/* Compact Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-100 border border-green-200"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-100 border border-orange-200"></div>
            <span>Late Check-in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-100 border border-purple-200"></div>
            <span>Early Check-out</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-100 border border-red-200"></div>
            <span>Late & Early</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-100 border border-gray-200"></div>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-100 border border-yellow-200"></div>
            <span>Weekend</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {[
          { key: "sun", label: "S" },
          { key: "mon", label: "M" },
          { key: "tue", label: "T" },
          { key: "wed", label: "W" },
          { key: "thu", label: "T" },
          { key: "fri", label: "F" },
          { key: "sat", label: "S" },
        ].map((day) => (
          <div
            key={day.key}
            className="bg-gray-50 p-1 text-center text-xs font-medium text-gray-500"
          >
            {day.label}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((date, index) => {
          const status = getAttendanceStatus(date)
          const isCurrentMonth = isSameMonth(date, currentDate)
          const isCurrentDay = isToday(date)
          // Find the attendance record for this date (if any)
          const attendanceRecord = attendanceData.find((item) =>
            isSameDay(new Date(item.date), date)
          )

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
                className={`h-full rounded-md border p-1 transition-colors ${getStatusColor(
                  status
                )} ${isCurrentDay ? "ring-1 ring-blue-500" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`text-xs font-medium ${
                      !isCurrentMonth ? "text-gray-400" : "text-gray-900"
                    }`}
                  >
                    {format(date, "d")}
                  </span>
                  {/* Show check-in/out times inside the same box when hovered */}
                  {isSameDay(date, hoveredDate) && (
                    <div className="mt-1 text-[10px] text-center">
                      {attendanceRecord ? (
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