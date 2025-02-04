import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fetchEmployee } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import Activities from "../components/Home/Activities"
import Profile from "../components/Home/Profile"
import LeaveApprovals from "../components/Home/LeaveApprovals"
import AttendanceKiosk from "../components/Home/AttendanceKiosk"
import MissPunchApprovals from "../components/Home/MissPunchApprovals"
import Warnings from "../components/Home/Warnings"
import Terminations from "../components/Home/Terminations"
import Resignations from "../components/Home/Resignations"

// List of valid tabs for validation
const VALID_TABS = [
  "activities",
  "profile",
  "leave-approvals",
  "attendance-kiosk",
  "miss-punch",
  "warnings",
  "terminations",
  "resignations",
]

function Home() {
  // Initialize activeTab from sessionStorage with validation
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("activeTab")
      return VALID_TABS.includes(savedTab) ? savedTab : "activities"
    }
    return "activities"
  })

  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  // Update sessionStorage when activeTab changes
  useEffect(() => {
    sessionStorage.setItem("activeTab", activeTab)
  }, [activeTab])

  useEffect(() => {
    const getEmployeeData = async () => {
      try {
        const employeeId = user?.sub
        if (!employeeId) {
          throw new Error("No employee ID found")
        }
        const data = await fetchEmployee(employeeId)
        setEmployee(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getEmployeeData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 text-red-500 p-4 rounded-md max-w-lg">
          <p className="font-medium">Error loading employee data:</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "activities", label: "Activities" },
    { id: "profile", label: "Profile" },
    { id: "leave-approvals", label: "Leave Approvals" },
    { id: "attendance-kiosk", label: "Attendance Kiosk" },
    { id: "miss-punch", label: "Miss Punch" },
    { id: "warnings", label: "Warnings" },
    { id: "terminations", label: "Terminations" },
    { id: "resignations", label: "Resignations" },
  ]

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
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
          {activeTab === "activities" && <Activities employee={employee} />}
          {activeTab === "profile" && <Profile employee={employee} />}
          {activeTab === "leave-approvals" && <LeaveApprovals />}
          {activeTab === "attendance-kiosk" && <AttendanceKiosk />}
          {activeTab === "miss-punch" && <MissPunchApprovals />}
          {activeTab === "warnings" && <Warnings />}
          {activeTab === "terminations" && <Terminations />}
          {activeTab === "resignations" && <Resignations />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Home;