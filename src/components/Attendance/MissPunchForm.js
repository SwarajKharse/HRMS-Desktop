import { useState } from "react"
import { motion } from "framer-motion"
import { missPunchService } from "../../services/missPunchService"
import { authService } from "../../services/authService";
import { format } from "date-fns"
import { FiClock, FiCalendar, FiMessageSquare } from "react-icons/fi"

function MissPunchForm({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    checkIn: "",
    checkOut: "",
    comments: "",
    employee: {
      id: authService.getUser().sub
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await missPunchService.apply(formData);
      onSubmit()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Miss Punch Request</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FiCalendar className="w-4 h-4 mr-2" />
              Date <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          {/* Time Fields - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiClock className="w-4 h-4 mr-2" />
                Check In <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="time"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiClock className="w-4 h-4 mr-2" />
                Check Out <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="time"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Comments Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FiMessageSquare className="w-4 h-4 mr-2" />
              Comments <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows="3"
              required
              placeholder="Please provide a reason for the miss punch"
            />
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default MissPunchForm;