import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import DailyLeaveStatus from "../components/Reports/DailyLeaveStatus"
import ResourceAvailability from "../components/Reports/ResourceAvailability"
import LeaveBookedAndBalance from "../components/Reports/LeaveBookedAndBalance"
import AttendanceReport from "../components/Reports/AttendanceReport";
import PayrollReport from "../components/Reports/PayrollReport";
import { FiCalendar, FiUsers, FiClock, FiPieChart } from "react-icons/fi"

// List of valid tabs for validation
const VALID_TABS = ["daily-leave-status", "resource-availability", "leave-booked-balance", "attendance-report", "payroll-report"]

function Reports() {
  // Initialize activeTab from sessionStorage with validation
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("reportsActiveTab")
      return VALID_TABS.includes(savedTab) ? savedTab : "daily-leave-status"
    }
    return "daily-leave-status"
  })

  // Update sessionStorage when activeTab changes
  useEffect(() => {
    sessionStorage.setItem("reportsActiveTab", activeTab)
  }, [activeTab])

  const tabs = [
    { id: "daily-leave-status", label: "Daily Leave Status", icon: FiCalendar },
    { id: "resource-availability", label: "Resource Availability", icon: FiUsers },
    { id: "leave-booked-balance", label: "Leave Booked & Balance", icon: FiPieChart },
    { id: "attendance-report", label: "Attendance Report", icon: FiClock },
    { id: "payroll-report", label: "Payroll Report", icon: FiClock },
  ]

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "daily-leave-status" && <DailyLeaveStatus />}
          {activeTab === "resource-availability" && <ResourceAvailability />}
          {activeTab === "leave-booked-balance" && <LeaveBookedAndBalance />}
          {activeTab === "attendance-report" && <AttendanceReport />}
          {activeTab === "payroll-report" && <PayrollReport />}
          {/* Add other report components as they are created */}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Reports;