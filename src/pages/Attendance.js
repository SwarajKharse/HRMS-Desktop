import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import AttendanceCalendar from "../components/Attendance/AttendanceCalendar"
import MissPunchForm from "../components/Attendance/MissPunchForm"
import MissPunchList from "../components/Attendance/MissPunchList"
import { FiCalendar, FiClock, FiPlus } from "react-icons/fi"

// List of valid tabs for validation
const VALID_TABS = ["summary", "missPunch"]

function Attendance() {
  // Initialize activeTab from sessionStorage with validation
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("attendanceActiveTab")
      return VALID_TABS.includes(savedTab) ? savedTab : "summary"
    }
    return "summary"
  })

  const [showMissPunchForm, setShowMissPunchForm] = useState(false)

  // Update sessionStorage when activeTab changes
  useEffect(() => {
    sessionStorage.setItem("attendanceActiveTab", activeTab)
  }, [activeTab])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header with Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === "summary" ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900"}`}
          >
            <FiCalendar className="w-4 h-4 mr-2" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab("missPunch")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === "missPunch" ? "bg-white text-gray-900 shadow" : "text-gray-600 hover:text-gray-900"}`}
          >
            <FiClock className="w-4 h-4 mr-2" />
            Miss Punch
          </button>
        </div>

        {activeTab === "missPunch" && (
          <button
            onClick={() => setShowMissPunchForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            New Request
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === "summary" ? (
          <AttendanceCalendar />
        ) : (
          <div className="p-6">
            <MissPunchList />
          </div>
        )}
      </div>

      {/* Miss Punch Form Dialog */}
      <MissPunchForm
        isOpen={showMissPunchForm}
        onClose={() => setShowMissPunchForm(false)}
        onSubmit={() => {
          setShowMissPunchForm(false)
          // Refresh the miss punch list if we're on that tab
          if (activeTab === "missPunch") {
            // Trigger a refresh of the list
          }
        }}
      />
    </motion.div>
  )
}

export default Attendance;