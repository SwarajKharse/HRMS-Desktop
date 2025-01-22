import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FiSun,
  FiClock,
  FiDollarSign,
  FiUser,
  FiBook,
  FiActivity,
  FiCalendar,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
} from "react-icons/fi"
import {
  format,
  startOfYear,
  endOfYear,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
  isFuture,
} from "date-fns"
import LeaveCard from "./LeaveCard"
import { leaveService } from "../../services/leaveService"
import { leaveTypeService } from "../../services/leaveTypeService"
import LeaveForm from "./LeaveForm"
import { authService } from "../../services/authService"

function LeaveSummary() {
  const [viewType, setViewType] = useState("list")
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [leaves, setLeaves] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user] = useState(authService.getUser());

  // Map of leave categories to icons and colors
  const categoryStyles = {
    "Sick Leave": {
      icon: <FiActivity className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-100",
      calendarColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
    "Casual Leave": {
      icon: <FiSun className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-100",
      calendarColor: "bg-blue-100 text-blue-800 border-blue-200",
    },
    "Earned Leave": {
      icon: <FiClock className="w-6 h-6 text-green-600" />,
      color: "bg-green-100",
      calendarColor: "bg-green-100 text-green-800 border-green-200",
    },
    Other: {
      icon: <FiInfo className="w-6 h-6 text-gray-600" />,
      color: "bg-gray-100",
      calendarColor: "bg-gray-100 text-gray-800 border-gray-200",
    },
  }

  useEffect(() => {
    fetchData();
  }, [user])

  const fetchData = async () => {
    try {
      if (user?.sub && user?.orgId) {
        const [leaveTypesData, leavesData] = await Promise.all([
          leaveTypeService.getLeaveTypesByOrgId(user.orgId),
          leaveService.getLeavesByEmployeeId(user.sub),
        ]);

        // Transform leave types data
        const transformedLeaveTypes = leaveTypesData.map((type) => {
          const style = categoryStyles[type.leaveCategory] || categoryStyles["Other"]
          return {
            id: type.id,
            title: type.name,
            category: type.leaveCategory,
            icon: style.icon,
            color: style.color,
            calendarColor: style.calendarColor,
            available: type.accrualCount || 0,
            booked: 0, // Will be updated in updateLeaveTypeCounts
            effectiveAfter: {
              count: type.effectiveAfterCount,
              unit: type.effectiveAfterUnit,
            },
            accrual: {
              count: type.accrualCount,
              date: type.accrualDate,
              month: type.accrualMonth,
            },
          }
        })

        setLeaveTypes(transformedLeaveTypes)
        setLeaves(leavesData)
        updateLeaveTypeCounts(leavesData, transformedLeaveTypes)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateLeaveTypeCounts = (leaveData, types) => {
    const counts = {}
    leaveData.forEach((leave) => {
      if (leave.status === "APPROVED") {
        counts[leave.leaveType] = (counts[leave.leaveType] || 0) + 1
      }
    })

    setLeaveTypes(
      types.map((type) => ({
        ...type,
        booked: counts[type.title] || 0,
      })),
    )
  }

  // Calendar calculations
  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const startingDayIndex = monthStart.getDay()
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const totalDays = daysInMonth.length
  const totalCells = Math.ceil((totalDays + startingDayIndex) / 7) * 7

  const monthDates = Array.from({ length: totalCells }).map((_, index) => {
    const dayOffset = index - startingDayIndex
    const date = new Date(monthStart)
    date.setDate(monthStart.getDate() + dayOffset)
    return date
  })

  const handleLeaveSubmit = async (leaveData) => {
    try {
      await leaveService.applyLeave(leaveData)
      setShowLeaveForm(false)
      fetchData() // Refresh both leaves and counts
    } catch (error) {
      console.error("Error applying leave:", error)
    }
  }

  const handlePreviousYear = () => {
    setCurrentDate(subYears(currentDate, 1))
  }

  const handleNextYear = () => {
    setCurrentDate(addYears(currentDate, 1))
  }

  const handlePreviousMonth = () => {
    setCalendarDate(subMonths(calendarDate, 1))
  }

  const handleNextMonth = () => {
    setCalendarDate(addMonths(calendarDate, 1))
  }

  const getLeaveTypeInfo = (leaveTypeId) => {
    return leaveTypes.find((type) => type.id === leaveTypeId)
  }

  const getLeavesForDate = (date) => {
    return leaves.filter((leave) => {
      const startDate = new Date(leave.startDate)
      const endDate = new Date(leave.endDate)
      const currentDate = new Date(date)

      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      currentDate.setHours(0, 0, 0, 0)

      return currentDate >= startDate && currentDate <= endDate
    })
  }

  const getLeaveStatus = (leave) => {
    if (leave.status === "APPROVED") {
      return "Approved"
    } else if (leave.status === "REJECTED") {
      return "Rejected"
    } else {
      return "Pending"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium text-gray-900">
            Leave booked this year: {leaves.filter((leave) => leave.status === "APPROVED").length}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewType("list")}
              className={`p-2 rounded ${viewType === "list" ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}
            >
              <FiList size={20} />
            </button>
            <button
              onClick={() => setViewType("calendar")}
              className={`p-2 rounded ${viewType === "calendar" ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}
            >
              <FiCalendar size={20} />
            </button>
          </div>
          {viewType === "list" && (
            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
              <button className="text-gray-600" onClick={handlePreviousYear}>
                <FiChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium">
                01-Jan-{format(currentDate, "yyyy")} - 31-Dec-{format(currentDate, "yyyy")}
              </span>
              <button className="text-gray-600" onClick={handleNextYear}>
                <FiChevronRight size={20} />
              </button>
            </div>
          )}
          {viewType === "calendar" && (
            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
              <button className="text-gray-600" onClick={handlePreviousMonth}>
                <FiChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium">{format(calendarDate, "MMMM yyyy")}</span>
              <button className="text-gray-600" onClick={handleNextMonth}>
                <FiChevronRight size={20} />
              </button>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => setShowLeaveForm(true)}
          >
            Apply Leave
          </motion.button>
        </div>
      </div>

      {viewType === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {leaveTypes.map((leave) => (
            <LeaveCard key={leave.id} {...leave} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {monthDates.map((date, index) => {
              const isCurrentMonth = isSameMonth(date, calendarDate)
              const isCurrentDay = isToday(date)
              const dateLeaves = getLeavesForDate(date)

              return (
                <motion.div
                  key={index}
                  className={`relative bg-white min-h-[100px] p-2 ${!isCurrentMonth ? "opacity-50" : ""}`}
                  initial={false}
                >
                  <div
                    className={`
                    h-full rounded-lg border p-2
                    ${isCurrentDay ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                    ${dateLeaves.length === 0 ? "bg-gray-50" : ""}
                  `}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-medium ${!isCurrentMonth ? "text-gray-400" : "text-gray-900"}`}>
                        {format(date, "d")}
                      </span>
                      {dateLeaves.map((leave, leaveIndex) => {
                        const leaveType = getLeaveTypeInfo(leave.leaveType?.id)
                        const status = getLeaveStatus(leave)
                        return (
                          <div
                            key={leaveIndex}
                            className={`mt-1 p-1 rounded-md text-xs ${
                              isFuture(date)
                                ? leave.status === "APPROVED"
                                  ? leaveType?.calendarColor
                                  : getStatusColor("Pending")
                                : getStatusColor(status)
                            }`}
                          >
                            <div className="font-medium">{leave.leaveType?.name || "Unknown"}</div>
                            <div>{status}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showLeaveForm && (
          <LeaveForm
            isOpen={showLeaveForm}
            onClose={() => setShowLeaveForm(false)}
            onSubmit={handleLeaveSubmit}
            leaveTypes={leaveTypes.map((type) => ({
              id: type.id,
              name: type.title,
            }))}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default LeaveSummary;