import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import LeaveSummary from "../components/Leave/LeaveSummary"
import LeaveRequests from "../components/Leave/LeaveRequests"

// List of valid tabs for validation
const VALID_TABS = ["summary", "requests"]

function LeaveTracker() {
  // Initialize activeTab from sessionStorage with validation
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("leaveTrackerActiveTab")
      return VALID_TABS.includes(savedTab) ? savedTab : "summary"
    }
    return "summary"
  })

  // Update sessionStorage when activeTab changes
  useEffect(() => {
    sessionStorage.setItem("leaveTrackerActiveTab", activeTab)
  }, [activeTab])

  const tabs = [
    { id: "summary", label: "Leave Summary" },
    { id: "requests", label: "Leave Requests" }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "summary" && <LeaveSummary />}
          {activeTab === "requests" && <LeaveRequests />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default LeaveTracker;