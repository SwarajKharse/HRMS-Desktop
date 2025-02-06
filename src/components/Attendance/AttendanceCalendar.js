import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
import { FiChevronLeft, FiChevronRight, FiClock } from "react-icons/fi"
import { attendanceService } from "../../services/attendanceService"
import { authService } from "../../services/authService"

// Updated status colors and types
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
  "Half Day": {
    color: "bg-lime-100 text-lime-800 border-lime-200",
    label: "Half Day",
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
    color: "bg-teal-100 text-teal-800 border-teal-200",
    label: "Weekend",
  },
}

function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusSummary, setStatusSummary] = useState({})

  const fetchMonthlyAttendance = async (date) => {
    try {
      setLoading(true)
      const data = await attendanceService.getMonthlyAttendance(
        authService.getUser().sub,
        getMonth(date),
        getYear(date),
      )
      setAttendanceData(data)
      calculateStatusSummary(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    fetchMonthlyAttendance(currentDate)
  }, [currentDate, authService.getUser().sub]) // Fixed useEffect dependency

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
    return isPast(date) ? "Absent" : null // Only mark past dates as absent
  }

  const getStatusColor = (status) => {
    return STATUS_CONFIG[status]?.color || "bg-gray-50 text-gray-400 border-gray-200"
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const renderTimeInfo = (date) => {
    const dayData = attendanceData.find((item) => isSameDay(new Date(item.date), date))
    const isFutureDate = !isPast(date)

    if (isFutureDate) {
      if (dayData?.status === "Paid Leave" || dayData?.status === "Unpaid Leave") {
        return (
          <div className="text-xs space-y-1">
            <div className="text-gray-600 font-medium">Upcoming</div>
            {dayData.note && <div className="mt-1 text-gray-600 italic">{dayData.note}</div>}
          </div>
        )
      }
      return null
    }

    if (!dayData) return null

    return (
      <div className="text-xs space-y-1">
        {dayData.checkIn && (
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            <span>{dayData.checkIn}</span>
          </div>
        )}
        {dayData.checkOut && (
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            <span>{dayData.checkOut}</span>
          </div>
        )}
        {dayData.note && <div className="mt-1 text-gray-600 italic">{dayData.note}</div>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-white rounded-lg border border-gray-200">
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

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Calendar Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePreviousMonth}>
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handleNextMonth}>
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${config.color.split(" ")[0]} border ${config.color.split(" ")[2]}`}
                />
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((date, index) => {
            const status = getAttendanceStatus(date)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isCurrentDay = isToday(date)
            const isFutureDate = !isPast(date)

            return (
              <motion.div
                key={index}
                className={`relative bg-white min-h-[100px] p-2 ${!isCurrentMonth ? "opacity-50" : ""}`}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                initial={false}
                animate={{
                  scale: isSameDay(date, hoveredDate) ? 0.98 : 1,
                  transition: { duration: 0.1 },
                }}
              >
                <div
                  className={`
                    h-full rounded-lg border p-2 transition-colors
                    ${getStatusColor(status)}
                    ${isCurrentDay ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`
                        text-sm font-medium 
                        ${!isCurrentMonth ? "text-gray-400" : "text-gray-900"}
                      `}
                    >
                      {format(date, "d")}
                    </span>
                    {status && <span className="text-xs font-medium">{STATUS_CONFIG[status]?.label || status}</span>}
                    {isSunday(date) && !status && (
                      <span className="text-xs font-medium">{STATUS_CONFIG["Weekend"].label}</span>
                    )}
                  </div>

                  {/* Time Information */}
                  {isSameDay(date, hoveredDate) && renderTimeInfo(date)}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AttendanceCalendar;