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
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  subMonths,
  addMonths,
} from "date-fns"
import LeaveCard from "./LeaveCard"
import { leaveRequestService } from "../../services/leaveRequestService"
import { leaveBalanceService } from "../../services/leaveBalanceService"
import LeaveForm from "./LeaveForm"
import { authService } from "../../services/authService"

function LeaveSummary() {
  const [viewType, setViewType] = useState("list")
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [leaves, setLeaves] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user] = useState(authService.getUser());

  // Map of leave categories to icons and colors
  const categoryStyles = {
    Paid: {
      icon: <FiActivity className="w-6 h-6 text-emerald-600" />,
      color: "bg-emerald-100",
      calendarColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    Unpaid: {
      icon: <FiSun className="w-6 h-6 text-amber-600" />,
      color: "bg-amber-100",
      calendarColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
    "Earned Leave": {
      icon: <FiClock className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-100",
      calendarColor: "bg-blue-100 text-blue-800 border-blue-200",
    },
    Other: {
      icon: <FiInfo className="w-6 h-6 text-gray-600" />,
      color: "bg-gray-100",
      calendarColor: "bg-gray-100 text-gray-800 border-gray-200",
    },
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchData = async () => {
    try {
      if (user?.sub && user?.orgId) {
        const [leaveTypesData, leavesData] = await Promise.all([
          leaveBalanceService.getLeaveTypesByEmpId(user.sub),
          leaveRequestService.getLeavesByEmployeeId(user.sub),
        ]);

        // Transform leave types data
        const transformedLeaveTypes = leaveTypesData.map((type) => {
          const style = categoryStyles[type.leaveType.leaveCategory] || categoryStyles["Other"]
          return {
            id: type.leaveType.id,
            title: type.leaveType.name,
            category: type.leaveType.leaveCategory,
            icon: style.icon,
            color: style.color,
            calendarColor: style.calendarColor,
            available: type.leaveType.accrualCount,
            balance: type.balance, 
            status: type.status
          }
        })

        setLeaveTypes(transformedLeaveTypes);
        setLeaves(leavesData);
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calendar calculations (for the calendar view)
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

  // Calculate the number of approved leaves booked in the current month
  const approvedLeavesThisMonth = leaves.filter((leave) => {
    const leaveStart = new Date(leave.startDate)
    return leave.status === "APPROVED" && isSameMonth(leaveStart, new Date())
  }).length

  const handleLeaveSubmit = async (leaveData) => {
    try {
      await leaveRequestService.applyLeave(leaveData)
      setShowLeaveForm(false)
      fetchData() // Refresh both leaves and counts
    } catch (error) {
      console.error("Error applying leave:", error)
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
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
      {/* Updated header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium text-gray-900">
            Leaves booked this month: {approvedLeavesThisMonth}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          {viewType === "calendar" && (
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
              {/* For calendar view, keep month navigation; list view has no date navigation */}
                <>
                  <button className="text-gray-600" onClick={handlePreviousMonth}>
                    <FiChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-medium">{format(calendarDate, "MMMM yyyy")}</span>
                  <button className="text-gray-600" onClick={handleNextMonth}>
                    <FiChevronRight size={20} />
                  </button>
                </>
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
        </div>
      </div>

      {/* List view: display leave cards */}
      {viewType === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {leaveTypes.map((leave) => (
            <LeaveCard key={leave.id} {...leave} />
          ))}
        </div>
      ) : (
        /* Calendar view */
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
                      {dateLeaves.map((leave, leaveIndex) => (
                        <div
                          key={leaveIndex}
                          className={`mt-1 p-1 rounded-md text-xs font-medium ${
                            isCurrentMonth
                              ? leave.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                              : getStatusColor(leave.status)
                          } hover:opacity-90 transition-opacity`}
                        >
                          <div className="font-medium truncate">{leave.leaveType?.name || "Unknown"}</div>
                          <div className="text-[10px] opacity-90">{leave.status}</div>
                        </div>
                      ))}
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