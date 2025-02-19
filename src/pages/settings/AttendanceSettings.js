import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiClock, FiAlertCircle, FiCheck } from "react-icons/fi"
import { attendanceSettingsService } from "../../services/attendanceSettingsService"
import { useAuth } from "../../contexts/AuthContext"

function AttendanceSettings() {
  const [settings, setSettings] = useState({
    startTime: "09:00",
    endTime: "18:00",
    breakStartTime: "13:00",
    breakEndTime: "14:00",
    lateGraceTime: 15,
    earlyGraceTime: 15,
    noOfLatesAllowed: 3,
    noOfEarlysAllowed: 0,
    halfDayThreshold: 4,
    fullDayThreshold: 8,
    minOvertime: 60,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const data = await attendanceSettingsService.getAttendanceSettingsByOrgId(user.orgId)
      if (data) {
        setSettings({
          ...data,
          startTime: formatTime(data.startTime),
          endTime: formatTime(data.endTime),
        })
      }
      setError(null)
    } catch (err) {
      setError("Failed to load attendance settings")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time) => {
    if (!time) return ""
    return time.substring(0, 5) // Extract HH:mm from time string
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      const settingsData = {
        ...settings,
        org: { id: user.orgId },
      }

      if (settings.id) {
        await attendanceSettingsService.updateAttendanceSettings(settingsData)
      } else {
        await attendanceSettingsService.createAttendanceSettings(settingsData)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError("Failed to save attendance settings")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FiClock className="text-blue-600 w-6 h-6" />
        <h1 className="text-2xl font-bold">Attendance Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shift Start Time</label>
            <input
              type="time"
              name="startTime"
              value={settings.startTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shift End Time</label>
            <input
              type="time"
              name="endTime"
              value={settings.endTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Break Start Time</label>
            <input
              type="time"
              name="breakStartTime"
              value={settings.breakStartTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Break End Time </label>
            <input
              type="time"
              name="breakEndTime"
              value={settings.breakEndTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Late Grace Time (minutes)</label>
            <input
              type="number"
              name="lateGraceTime"
              value={settings.lateGraceTime}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Early Grace Time (minutes)</label>
            <input
              type="number"
              name="earlyGraceTime"
              value={settings.earlyGraceTime}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Lates Allowed</label>
            <input
              type="number"
              name="noOfLatesAllowed"
              value={settings.noOfLatesAllowed}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Earlies Allowed</label>
            <input
              type="number"
              name="noOfEarlysAllowed"
              value={settings.noOfEarlysAllowed}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Half Day Time (in hours)</label>
            <input
              type="number"
              name="halfDayThreshold"
              value={settings.halfDayThreshold}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily working Hours (in hours)</label>
            <input
              type="number"
              name="fullDayThreshold"
              value={settings.fullDayThreshold}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Overtime required (in minutes)</label>
            <input
              type="number"
              name="minOvertime"
              value={settings.minOvertime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        )}

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 text-green-500 p-4 rounded-md flex items-center"
            >
              <FiCheck className="mr-2" />
              Settings saved successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
              saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AttendanceSettings;