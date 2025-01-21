import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiSettings, FiAlertCircle } from "react-icons/fi"
import { attendanceSettingsService } from "../../services/attendanceSettingsService"
import { authService } from "../../services/authService"

function AttendanceSettings() {
  const [formData, setFormData] = useState({
    fullDay: null,
    halfDay: null,
    totalHours: null,
    org: {
      id: authService.getUser().orgId,
    },
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [existingSettings, setExistingSettings] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const data = await attendanceSettingsService.getByOrgId(authService.getUser().orgId) // Hardcoded orgId
      if (data) {
        setFormData(data)
        setExistingSettings(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: Number.parseInt(value, 10) || 0,
    }))
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      if (existingSettings?.id) {
        await attendanceSettingsService.update(existingSettings.id, formData)
      } else {
        await attendanceSettingsService.save(formData)
      }
      await fetchSettings()
    } catch (err) {
      setError(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (existingSettings) {
      setFormData(existingSettings)
    } else {
      setFormData({
        fullDay: 8,
        halfDay: 4,
        totalHours: 8,
        org: { id: 1 },
      })
    }
    setError("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <FiSettings className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Settings</h1>
          <p className="text-sm text-gray-500">Configure attendance rules and requirements</p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-500 p-4 rounded-md flex items-center"
        >
          <FiAlertCircle className="mr-2" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid gap-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Day Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="fullDay"
                required
                min="1"
                max="24"
                value={formData.fullDay}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Half Day Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="halfDay"
                required
                min="1"
                max="12"
                value={formData.halfDay}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Hours Required <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="totalHours"
                required
                min="1"
                max="24"
                value={formData.totalHours}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AttendanceSettings;