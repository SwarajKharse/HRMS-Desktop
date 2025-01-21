import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiAlertCircle } from "react-icons/fi"
import { holidayService } from "../../services/holidayService"
import { authService } from "../../services/authService"

function HolidayForm({ holiday, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
    org: {
      id: authService.getUser().orgId,
    },
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (holiday) {
      setFormData({
        ...holiday,
        date: holiday.date.split("T")[0], // Format date for input
      })
    }
  }, [holiday])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (holiday?.id) {
        await holidayService.updateHoliday(holiday.id, formData)
      } else {
        await holidayService.createHoliday(formData)
      }
      if (onSubmit) await onSubmit()
      onClose()
    } catch (err) {
      setError(err.message || "Failed to save holiday")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">{holiday ? "Edit Holiday" : "Add New Holiday"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-4 bg-red-50 text-red-500 p-4 rounded-md flex items-center"
          >
            <FiAlertCircle className="mr-2" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Holiday Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save Holiday"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default HolidayForm;