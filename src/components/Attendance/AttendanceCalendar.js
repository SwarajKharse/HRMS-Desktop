import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "date-fns";
import { FiChevronLeft, FiChevronRight, FiClock, FiChevronDown, FiX } from "react-icons/fi";
import { attendanceService } from "../../services/attendanceService";
import { authService } from "../../services/authService";
import { holidayService } from "../../services/holidayService";
import { getErrorMessage } from "../../utils/errorUtils";
import { LocationDisplay, PhotoThumbnail } from "./AttendancePhotoLocation";

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
    color: "bg-yellow-200 text-yellow-800 border-yellow-300",
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

  if (status === "Half Day" && record && record.isHalfDayPaid) {
    return "bg-gradient-to-r from-lime-100 to-blue-100 text-blue-800 border-blue-200"
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

// Shared between the always-visible desktop legend and the collapsed
// mobile disclosure, so the two never drift apart.
function LegendContent() {
  return (
    <>
      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
        <div key={status} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color.split(" ")[0]} border ${config.color.split(" ")[2]}`} />
          <span>{config.label}</span>
        </div>
      ))}
      {Object.entries(STATUS_INDICATORS).map(([status, config]) => (
        <div key={status} className="flex items-center gap-2">
          <div className={`px-1 text-[10px] rounded ${config.color}`}>{config.code}</div>
          <span>{status}</span>
        </div>
      ))}
    </>
  )
}

// Employee self-view day detail: status + photos + location only.
// Times are intentionally never shown here - management asked employees
// see status only, not check-in/check-out times.
function DayDetailModal({ date, status, attendanceRecord, onClose }) {
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const isHolidayStatus = status && typeof status === "object" && status.type === "Holiday"
  const statusLabel = isHolidayStatus
    ? `Holiday${status.holiday?.name ? ` - ${status.holiday.name}` : ""}`
    : status || "No Data"

  const hasPunchDetails =
    attendanceRecord &&
    (attendanceRecord.checkInPhotoUrl ||
      attendanceRecord.checkInLocation ||
      attendanceRecord.checkOutPhotoUrl ||
      attendanceRecord.checkOutLocation)

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
          <h3 className="text-lg font-semibold text-gray-800">{format(date, "dd MMMM yyyy")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {statusLabel}
          </span>
        </div>

        {attendanceRecord?.note && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
            <p className="text-sm font-medium text-yellow-800">Note:</p>
            <p className="text-sm text-yellow-700">{attendanceRecord.note}</p>
          </div>
        )}

        {hasPunchDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Check-In</div>
              <div className="flex items-start gap-3">
                <PhotoThumbnail
                  url={attendanceRecord.checkInPhotoUrl}
                  alt="Check-in photo"
                  onClick={() => setLightboxUrl(attendanceRecord.checkInPhotoUrl)}
                />
                <div className="text-sm min-w-0">
                  <LocationDisplay location={attendanceRecord.checkInLocation} />
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Check-Out</div>
              <div className="flex items-start gap-3">
                <PhotoThumbnail
                  url={attendanceRecord.checkOutPhotoUrl}
                  alt="Check-out photo"
                  onClick={() => setLightboxUrl(attendanceRecord.checkOutPhotoUrl)}
                />
                <div className="text-sm min-w-0">
                  <LocationDisplay location={attendanceRecord.checkOutLocation} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No punch details for this day.</p>
        )}
      </motion.div>

      {/* Photo lightbox - full-size view of a check-in/check-out photo */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
            onClick={(e) => {
              // Nested inside this modal's own backdrop - a single click
              // must not close both at once.
              e.stopPropagation()
              setLightboxUrl(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxUrl}
                alt="Attendance punch photo"
                className="max-w-full max-h-[85vh] w-full rounded-lg object-contain bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusSummary, setStatusSummary] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [legendOpen, setLegendOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    calculateStatusSummary(attendanceData)
  }, [attendanceData, holidays, currentDate]);  

  const fetchMonthlyAttendance = async (date) => {
    try {
      setLoading(true);
      const data = await attendanceService.getMonthlyAttendance(
        authService.getUser().sub,
        getMonth(date),
        getYear(date),
      );
      setAttendanceData(data);
      calculateStatusSummary(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch attendance data"));
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (date) => {
    try {
      const data = await holidayService.getHolidaysByYear(authService.getUser().orgId, getYear(date));
      setHolidays(data);
    } catch (err) {
      console.error("Error fetching holidays:", err);
    }
  };

  const calculateStatusSummary = (data) => {
    // Initialize with the simplified status categories
    const summary = Object.keys(STATUS_CONFIG).reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});

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

  useEffect(() => {
    fetchMonthlyAttendance(currentDate)
    fetchHolidays(currentDate)
  }, [currentDate, authService.getUser().sub])

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

    const holiday = holidays.find((h) => isSameDay(new Date(h.date), date))
    if (holiday) return { type: "Holiday", holiday }

    const dayData = attendanceData.find((item) => isSameDay(new Date(item.date), date))
    if (dayData) return dayData.status;
    if (isSunday(date)) return "Weekend";
    return isPast(date) ? "No Data" : null;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date) => {
    if (!isSameMonth(date, currentDate)) return
    setSelectedDate(date)
  }

  const getSelectedDateRecord = () => {
    if (!selectedDate) return null
    return attendanceData.find((item) => isSameDay(new Date(item.date), selectedDate))
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
                  className={`rounded-lg p-3 flex items-center justify-between ${STATUS_CONFIG[status]?.color || "bg-gray-100 text-gray-800"}`}
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
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start md:space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePreviousMonth}>
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold flex-1 text-center md:flex-none">{format(currentDate, "MMMM yyyy")}</h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handleNextMonth}>
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Legend - desktop: inline, unchanged */}
          <div className="hidden md:flex flex-wrap items-center gap-3 text-sm">
            <LegendContent />
          </div>

          {/* Legend - mobile: collapsed disclosure, closed by default */}
          <div className="md:hidden w-full">
            <button
              type="button"
              onClick={() => setLegendOpen((open) => !open)}
              className="flex items-center justify-between w-full min-h-[44px] px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
            >
              <span>Legend</span>
              <FiChevronDown className={`w-4 h-4 transition-transform ${legendOpen ? "rotate-180" : ""}`} />
            </button>
            {legendOpen && (
              <div className="flex flex-wrap items-center gap-3 text-sm mt-2 p-3 bg-gray-50 rounded-lg">
                <LegendContent />
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-gray-50 p-1 md:p-2 text-center text-xs md:text-sm font-medium text-gray-500">
              <span className="md:hidden">{day[0]}</span>
              <span className="hidden md:inline">{day}</span>
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((date, index) => {
            const status = getAttendanceStatus(date)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isCurrentDay = isToday(date)
            const attendanceRecord = attendanceData.find((item) => isSameDay(new Date(item.date), date))
            const cellColor = getStatusColor(status, attendanceRecord)
            const statusIndicator = getStatusIndicator(typeof status === "string" ? status : null)
            const isHoliday = status && typeof status === "object" && status.type === "Holiday"

            return (
              <motion.div
                key={index}
                className={`relative bg-white aspect-square md:aspect-auto md:min-h-[100px] p-1 md:p-2 ${
                  !isCurrentMonth ? "opacity-50" : "cursor-pointer"
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
                    h-full rounded-lg border p-1 md:p-2 transition-colors
                    ${cellColor}
                    ${isCurrentDay ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                  `}
                >
                  {/* Mobile: date number centred in the cell */}
                  <div className="md:hidden absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-medium ${!isCurrentMonth ? "text-gray-400" : "text-gray-900"}`}>
                      {format(date, "d")}
                    </span>
                  </div>

                  {/* Desktop: unchanged top-left date number + Weekend label */}
                  <div className="hidden md:flex justify-between items-start">
                    <span className={`text-sm font-medium ${!isCurrentMonth ? "text-gray-400" : "text-gray-900"}`}>
                      {format(date, "d")}
                    </span>
                    {isSunday(date) && !status && (
                      <span className="text-xs font-medium">{STATUS_CONFIG["Weekend"].label}</span>
                    )}
                  </div>

                  {/* Status Indicator Badge (for LC, EC, LCE) - bottom corner on mobile so it never
                      overlaps the centred date number; unchanged top-right corner on desktop */}
                  {statusIndicator && (
                    <div className={`absolute bottom-1 right-1 md:top-1 md:bottom-auto ${statusIndicator.color} text-[10px] md:text-xs px-1 py-0.5 rounded font-medium`}>
                      {statusIndicator.code}
                    </div>
                  )}

                  {/* Display Holiday Badge with Holiday Name - desktop only, no room on mobile */}
                  {isHoliday && (
                    <div className="hidden md:block absolute bottom-1 left-1 bg-pink-500 text-white text-xs px-1 py-0.5 rounded font-medium">
                      Holiday
                    </div>
                  )}

                  {/* Overtime Badge - desktop only, no room on mobile */}
                  {attendanceRecord && attendanceRecord.overtimeMinutes > 0 && (
                    <div className="hidden md:block absolute bottom-1 right-1 bg-indigo-600 text-white text-xs px-1 py-0.5 rounded">
                      OT {attendanceRecord.overtimeMinutes}m
                    </div>
                  )}

                  {/* Time Information on Hover - desktop only (mobile uses tap-to-open modal) */}
                  {isSameDay(date, hoveredDate) && (
                    <div className="hidden md:block">
                      {isHoliday ? (
                        <div className="text-base text-pink-800 font-medium">
                          {status.holiday.name}
                        </div>
                      ) : (
                        renderTimeInfo(date)
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Day Detail Modal - status, photos, location. No times (self-view). */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailModal
            date={selectedDate}
            status={getAttendanceStatus(selectedDate)}
            attendanceRecord={getSelectedDateRecord()}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default AttendanceCalendar;
