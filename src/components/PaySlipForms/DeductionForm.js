import { useState } from "react"
import { motion } from "framer-motion"
import { FiX } from "react-icons/fi"

function DeductionForm({ onSubmit, onClose, month = null, year = null, initialData = null, employeeId }) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount || "",
    description: initialData?.description || "",
    date: initialData?.date || (year && month ? new Date(year, month, 0).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
  })

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }
    if (!formData.description) {
      newErrors.description = "Description is required"
    }
    if (!formData.date) {
      newErrors.date = "Date is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        ...formData,
        id: initialData?.id,
        employee: { id: employeeId },
        amount: Number.parseFloat(formData.amount),
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
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
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData ? "Edit Deduction" : "Add New Deduction"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                ${
                  errors.amount
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                }`}
              placeholder="Enter amount"
              step="0.01"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                ${
                  errors.description
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                }`}
              placeholder="Enter description"
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                ${
                  errors.date
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                }`}
            />
            {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default DeductionForm

