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
import { FiChevronLeft, FiChevronRight, FiX, FiCheck, FiAlertCircle, FiCalendar } from "react-icons/fi"
import { attendanceService } from "../../services/attendanceService"
import { holidayService } from "../../services/holidayService"
import { authService } from "../../services/authService"
import { leaveBalanceService } from "../../services/leaveBalanceService"

// Simplified status configuration with fewer categories but clear indicators
const STATUS_CONFIG = {
  Present: {
    color: "bg-green-200 text-green-800 border-green-300",
    label: "Present",
  },
  Absent: {
    color: "bg-red-400 text-red-800 border-red-500",
    label: "Absent",
  },
  "Half Day": {
    color: "bg-yellow-200 text-yellow-900 border-yellow-300",
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
    color: "bg-teal-200 text-teal-800 border-teal-300",
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
  // Handle holiday object
  if (status && typeof status === "object" && status.type === "Holiday") {
    return STATUS_CONFIG["Holiday"].color
  }

  // For attendance issues, use the Present color but add an indicator badge
  if (status === "Late Check-in" || status === "Early Check-out" || status === "Late Check-in and Early Check-out") {
    return STATUS_CONFIG["Present"].color
  }

  if (status === "Overtime") {
    return "bg-indigo-100 text-indigo-800 border-indigo-200"
  }

  if (status === "Half Day" && record && record.isHalfDayPaid) {
  return "bg-yellow-200 text-yellow-800 border-yellow-300"; // <-- Change this line
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
  const [attendanceType, setAttendanceType] = useState(
    attendance?.isHalfDay
      ? "halfDay"
      : attendance?.isLeave
        ? "leave"
        : attendance?.isAbsent
          ? "absent"
          : attendance?.isHoliday
            ? "holiday"
            : attendance?.isWeekend
              ? "weekend"
              : "present",
  )
  const [leaveTypes, setLeaveTypes] = useState([])
  const [selectedLeaveType, setSelectedLeaveType] = useState(attendance?.leaveType?.id || "")
  const [updating, setUpdating] = useState(false)
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false)
  const [error, setError] = useState(null)

  // Get selected leave type details
  const getSelectedLeaveTypeDetails = () => {
    if (!selectedLeaveType) return null
    return leaveTypes.find((type) => type.id === selectedLeaveType)
  }

  const selectedLeaveTypeDetails = getSelectedLeaveTypeDetails()
  const isPaidLeave = selectedLeaveTypeDetails?.category === "Paid"

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setLoadingLeaveTypes(true)
        const user = authService.getUser()
        const data = await leaveBalanceService.getLeaveTypesByEmpId(employeeId, getMonth(date) + 1, getYear(date))
        setLeaveTypes(
          data.map((item) => ({
            id: item.leaveType.id,
            name: item.leaveType.name,
            balance: item.balance,
            category: item.leaveType.leaveCategory,
          })),
        )
      } catch (err) {
        console.error("Failed to fetch leave types:", err)
        setError("Failed to load leave types")
      } finally {
        setLoadingLeaveTypes(false)
      }
    }

    if (attendanceType === "leave" || attendanceType === "halfDay") {
      fetchLeaveTypes()
    }
  }, [attendanceType, employeeId])

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      setError(null)

      // Get leave type details
      const leaveTypeDetails = getSelectedLeaveTypeDetails()
      const isPaid = leaveTypeDetails?.category === "Paid"

      // Prepare the attendance data based on the selected type
      const attendanceData = {
        employee: { id: employeeId },
        date: format(date, "yyyy-MM-dd"),
        checkIn: attendanceType === "present" || attendanceType === "halfDay" ? checkIn : null,
        checkOut: attendanceType === "present" || attendanceType === "halfDay" ? checkOut : null,
        isHalfDay: attendanceType === "halfDay",
        isLeave: attendanceType === "leave",
        isPaid: attendanceType === "leave" && isPaid,
        isAbsent: attendanceType === "absent",
        isPresent: attendanceType === "present" || attendanceType === "halfDay",
        isHoliday: attendanceType === "holiday",
        isWeekend: attendanceType === "weekend",
      }

      // Add leave type if applicable
      if ((attendanceType === "leave" || attendanceType === "halfDay") && selectedLeaveType) {
        attendanceData.leaveType = { id: Number.parseInt(selectedLeaveType) }
      }

      await attendanceService.updateAttendance(attendanceData)
      onUpdate()
      onClose()
    } catch (error) {
      console.error("Failed to update attendance:", error)
      setError("Failed to update attendance. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Attendance for {format(date, "dd MMMM yyyy")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Attendance Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Attendance Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAttendanceType("present")}
                className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                  attendanceType === "present"
                    ? "bg-green-50 border-green-300 text-green-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                    <FiCheck
                      className={`w-5 h-5 ${attendanceType === "present" ? "text-green-600" : "text-gray-400"}`}
                    />
                  </div>
                  <span>Present</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceType("absent")}
                className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                  attendanceType === "absent"
                    ? "bg-red-50 border-red-300 text-red-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-1">
                    <FiX className={`w-5 h-5 ${attendanceType === "absent" ? "text-red-600" : "text-gray-400"}`} />
                  </div>
                  <span>Absent</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceType("halfDay")}
                className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                  attendanceType === "halfDay"
                    ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-1">
                    <div className="w-4 h-4 bg-amber-500 rounded-r-full"></div>
                  </div>
                  <span>Half Day</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceType("leave")}
                className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                  attendanceType === "leave"
                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                    <FiCalendar
                      className={`w-5 h-5 ${attendanceType === "leave" ? "text-blue-600" : "text-gray-400"}`}
                    />
                  </div>
                  <span>Leave</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceType("holiday")}
                className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                  attendanceType === "holiday"
                    ? "bg-pink-50 border-pink-300 text-pink-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mb-1">
                    <FiCalendar
                      className={`w-5 h-5 ${attendanceType === "holiday" ? "text-pink-600" : "text-gray-400"}`}
                    />
                  </div>
                  <span>Holiday</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceType("weekend")}
                className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                  attendanceType === "weekend"
                    ? "bg-teal-50 border-teal-300 text-teal-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mb-1">
                    <FiCalendar
                      className={`w-5 h-5 ${attendanceType === "weekend" ? "text-teal-600" : "text-gray-400"}`}
                    />
                  </div>
                  <span>Weekend</span>
                </div>
              </button>
            </div>
          </div>

          {attendance?.note && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Note:</p>
              <p className="text-sm text-yellow-700">{attendance.note}</p>
            </div>
          )}

          {/* Check-in/Check-out times (only for Present and Half Day) */}
          {(attendanceType === "present" || attendanceType === "halfDay") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
                  Check In
                </label>
                <input
                  type="time"
                  id="checkIn"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
                  Check Out
                </label>
                <input
                  type="time"
                  id="checkOut"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Leave Type Selection */}
          {(attendanceType === "leave" || attendanceType === "halfDay") && (
            <div>
              <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              {loadingLeaveTypes ? (
                <div className="flex items-center justify-center h-12 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading leave types...</span>
                </div>
              ) : leaveTypes.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                  No leave types available
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="leaveType"
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.category}) - Balance: {type.balance}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              )}

              {selectedLeaveTypeDetails && (
                <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{selectedLeaveTypeDetails.name}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedLeaveTypeDetails.category === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {selectedLeaveTypeDetails.category}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Available Balance</span>
                    <span className="text-sm font-semibold">{selectedLeaveTypeDetails.balance}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={
                updating || ((attendanceType === "leave" || attendanceType === "halfDay") && !selectedLeaveType)
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                updating || ((attendanceType === "leave" || attendanceType === "halfDay") && !selectedLeaveType)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  Update
                </>
              )}
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

    // Count holidays separately
    const holidaysInMonth = holidays.filter((holiday) => isSameMonth(new Date(holiday.date), currentDate)).length

    if (holidaysInMonth > 0) {
      summary["Holiday"] = holidaysInMonth
    }

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
    if (!isSameMonth(date, currentDate)) return null;
  
    const holiday = holidays.find((h) => isSameDay(new Date(h.date), date));
    const dayData = attendanceData.find((item) => isSameDay(new Date(item.date), date));
  
    if (holiday) {
      // If a holiday exists but there's an attendance record with Absent, prioritize Absent.
      if (dayData && dayData.status === "Absent") {
        return "Absent";
      }
      return { type: "Holiday", holiday };
    }
  
    if (dayData) return dayData.status;
    if (isSunday(date)) return "Weekend";
    return isPast(date) ? "No Data" : null;
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
            const statusIndicator = getStatusIndicator(typeof status === "string" ? status : null)
            const isHoliday = status && typeof status === "object" && status.type === "Holiday"
            const isLeave = attendanceRecord?.isLeave
            const isHalfDay = attendanceRecord?.isHalfDay

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
                    {/* On hover, show check-in/out times or holiday name */}
                    {isSameDay(date, hoveredDate) && (
                      <div className="mt-1 text-[10px] text-center">
                        {isHoliday ? (
                          <div className="text-pink-800 font-medium text-base">{status.holiday.name}</div>
                        ) : !isPast(date) && attendanceRecord?.status?.includes("Leave") ? (
                          <div className="text-gray-600 font-medium">Upcoming {attendanceRecord.status}</div>
                        ) : attendanceRecord ? (
                          <>
                            {attendanceRecord.note && (
                              <div className="mb-1 text-yellow-700 font-medium border-b border-yellow-200 pb-1">
                                Note: {attendanceRecord.note}
                              </div>
                            )}
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

                  {/* Display Holiday label */}
                  {isHoliday && (
                    <div className="absolute bottom-1 left-1 bg-pink-500 text-white text-xs px-1 py-0.5 rounded font-medium">
                      Holiday
                    </div>
                  )}

                  {/* Paid or Unpaid label for Leave */}
                  {isLeave && (
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded font-medium">
                      {attendanceRecord.isPaid ? "Paid" : "Unpaid"}
                    </div>
                  )}

                  {/* Paid or Unpaid label for Halfday */}
                  {isHalfDay && (
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded font-medium">
                      {attendanceRecord.isHalfDayPaid ? "Paid" : "Unpaid"}
                    </div>
                  )}

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
                    <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1 py-0.5 rounded">NCO</div>
                  )}

                  {attendanceRecord?.note && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 bg-yellow-400 text-yellow-800 text-xs px-1 py-0.5 rounded-full">
                      <span className="sr-only">Has note</span>!
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