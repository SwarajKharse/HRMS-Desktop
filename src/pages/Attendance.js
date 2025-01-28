import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { attendanceService } from "../services/attendanceService"
import AttendanceCalendar from "../components/Attendance/AttendanceCalendar"
import MissPunchForm from "../components/Attendance/MissPunchForm"
import MissPunchList from "../components/Attendance/MissPunchList"
import { FiCalendar, FiClock, FiPlus } from "react-icons/fi"

function Attendance() {
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("summary")
  const [showMissPunchForm, setShowMissPunchForm] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = [
          {
            date: "2025-01-05",
            firstIn: null,
            lastOut: null,
            totalHours: null,
            payableHours: "08:00",
            status: "Weekend",
            regularization: null,
          },
          {
            date: "2025-01-06",
            firstIn: null,
            lastOut: null,
            totalHours: null,
            payableHours: null,
            status: "Absent",
            regularization: null,
          },
        ]
        setAttendanceData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

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
          <AttendanceCalendar data={attendanceData} />
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