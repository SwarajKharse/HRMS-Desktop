import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiAlertCircle } from "react-icons/fi"
import { differenceInDays, parseISO } from "date-fns"
import { leaveRequestService } from "../../services/leaveRequestService";
import { authService } from "../../services/authService";

function LeaveForm({ isOpen, onClose, onSubmit, leaveTypes }) {
  const [formData, setFormData] = useState({
    leaveType: {
      id: "",
    },
    employee: {
      id: authService.getUser().sub,
    },
    appliedDate: new Date().toISOString().split("T")[0],
    startDate: "",
    endDate: "",
    duration: 0,
    reason: "",
    status: "PENDING",
    managerComments: "",
  });

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = parseISO(formData.startDate)
      const end = parseISO(formData.endDate)
      const duration = differenceInDays(end, start) + 1 // Including both start and end dates
      setFormData((prev) => ({
        ...prev,
        duration: duration > 0 ? duration : 0,
      }))
    }
  }, [formData.startDate, formData.endDate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === "leaveType") {
        return {
          ...prev,
          leaveType: {
            id: value,
          },
        }
      }
      return {
        ...prev,
        [name]: value,
      }
    })

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.leaveType.id) newErrors.leaveType = "Leave type is required"
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (!formData.reason) newErrors.reason = "Reason is required"
    if (formData.duration < 1) newErrors.endDate = "End date must be after or equal to start date"
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setError("")

    try {
      // Convert dates to proper format for backend
      const submitData = {
        ...formData,
        appliedDate: new Date(formData.appliedDate).toISOString(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }

      await leaveRequestService.applyLeave(submitData);
      if (onSubmit) {
        await onSubmit();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to apply leave")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Apply Leave</h2>
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
              Leave type <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveType"
              value={formData.leaveType.id}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.leaveType ? "border-red-500" : "border-gray-300"
              } px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              <option value="">Select</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.leaveType && <p className="mt-1 text-sm text-red-500">{errors.leaveType}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className={`mt-1 block w-full rounded-md border ${
                  errors.startDate ? "border-red-500" : "border-gray-300"
                } px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || new Date().toISOString().split("T")[0]}
                className={`mt-1 block w-full rounded-md border ${
                  errors.endDate ? "border-red-500" : "border-gray-300"
                } px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          {formData.duration > 0 && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                Duration: {formData.duration} day{formData.duration > 1 ? "s" : ""}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason for leave <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={4}
              className={`mt-1 block w-full rounded-md border ${
                errors.reason ? "border-red-500" : "border-gray-300"
              } px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Enter reason for leave"
            />
            {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
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
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default LeaveForm;