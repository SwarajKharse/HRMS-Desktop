import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiDollarSign, FiAlertCircle, FiCheck } from "react-icons/fi"
import { payrollSettingsService } from "../../services/payrollSettingsService"
import { useAuth } from "../../contexts/AuthContext"

function PayrollSettings() {
  const [settings, setSettings] = useState({
    startDate: 27,
    endDate: 26,
    workingDays: 26,
    basicSalaryPercent: 0,
    hraPercent: 0,
    daPercent: 0,
    ptMaleBelow15T: 0,
    ptMaleFrom15To20T: 150,
    ptMaleAbove20T: 200,
    ptFemaleBelow15T: 0,
    ptFemaleFrom15To20T: 100,
    ptFemaleAbove20T: 150,
    pfPercent: 0,
    esicPercent: 0,
    gratuityPercent: 0,
    tdsBelow3LPercent: 0,
    tdsFrom3To6LPercent: 5,
    tdsFrom6To9LPercent: 10,
    tdsFrom9To12LPercent: 15,
    tdsFrom12To15LPercent: 20,
    tdsAbove15LPercent: 30,
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
      const data = await payrollSettingsService.getPayrollSettingsByOrgId(user.orgId)
      if (data) {
        setSettings(data)
      }
      setError(null)
    } catch (err) {
      setError("Failed to load payroll settings")
    } finally {
      setLoading(false)
    }
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

      await payrollSettingsService.createOrUpdatePayrollSettings(settingsData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError("Failed to save payroll settings")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: Number.parseFloat(value) || 0,
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FiDollarSign className="text-blue-600 w-6 h-6" />
        <h1 className="text-2xl font-bold">Payroll Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow">
        {/* Pay Period Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Pay Period Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="number"
                name="startDate"
                value={settings.startDate}
                onChange={handleChange}
                min="1"
                max="31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="number"
                name="endDate"
                value={settings.endDate}
                onChange={handleChange}
                min="1"
                max="31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
              <input
                type="number"
                name="workingDays"
                value={settings.workingDays}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Salary Components */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Salary Components (%)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary Percentage</label>
              <input
                type="number"
                name="basicSalaryPercent"
                value={settings.basicSalaryPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HRA Percentage</label>
              <input
                type="number"
                name="hraPercent"
                value={settings.hraPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DA Percentage</label>
              <input
                type="number"
                name="daPercent"
                value={settings.daPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Professional Tax - Male */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Professional Tax - Male (₹)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Below 15,000</label>
              <input
                type="number"
                name="ptMaleBelow15T"
                value={settings.ptMaleBelow15T}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">15,000 - 20,000</label>
              <input
                type="number"
                name="ptMaleFrom15To20T"
                value={settings.ptMaleFrom15To20T}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Above 20,000</label>
              <input
                type="number"
                name="ptMaleAbove20T"
                value={settings.ptMaleAbove20T}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Professional Tax - Female */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Professional Tax - Female (₹)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Below 15,000</label>
              <input
                type="number"
                name="ptFemaleBelow15T"
                value={settings.ptFemaleBelow15T}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">15,000 - 20,000</label>
              <input
                type="number"
                name="ptFemaleFrom15To20T"
                value={settings.ptFemaleFrom15To20T}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Above 20,000</label>
              <input
                type="number"
                name="ptFemaleAbove20T"
                value={settings.ptFemaleAbove20T}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Other Deductions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Other Deductions (%)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PF Percentage</label>
              <input
                type="number"
                name="pfPercent"
                value={settings.pfPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ESIC Percentage</label>
              <input
                type="number"
                name="esicPercent"
                value={settings.esicPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gratuity Percentage</label>
              <input
                type="number"
                name="gratuityPercent"
                value={settings.gratuityPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* TDS Slabs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">TDS Slabs (%)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Below 3L</label>
              <input
                type="number"
                name="tdsBelow3LPercent"
                value={settings.tdsBelow3LPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">3L - 6L</label>
              <input
                type="number"
                name="tdsFrom3To6LPercent"
                value={settings.tdsFrom3To6LPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">6L - 9L</label>
              <input
                type="number"
                name="tdsFrom6To9LPercent"
                value={settings.tdsFrom6To9LPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">9L - 12L</label>
              <input
                type="number"
                name="tdsFrom9To12LPercent"
                value={settings.tdsFrom9To12LPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">12L - 15L</label>
              <input
                type="number"
                name="tdsFrom12To15LPercent"
                value={settings.tdsFrom12To15LPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Above 15L</label>
              <input
                type="number"
                name="tdsAbove15LPercent"
                value={settings.tdsAbove15LPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
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

export default PayrollSettings;