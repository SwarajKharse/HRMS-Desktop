import { useState } from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";

function TdsSlabForm({ onSubmit, onClose, initialData = null }) {
  const [formData, setFormData] = useState({
    startSalary: initialData?.startSalary || "",
    endSalary: initialData?.endSalary || "",
    tdspercent: initialData?.tdspercent || "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {}
    if (!formData.startSalary) newErrors.startSalary = "Start salary is required"
    if (!formData.endSalary) newErrors.endSalary = "End salary is required"
    if (!formData.tdspercent) newErrors.tdspercent = "TDS percentage is required"
    if (Number.parseFloat(formData.startSalary) >= Number.parseFloat(formData.endSalary)) {
      newErrors.endSalary = "End salary must be greater than start salary"
    }
    if (Number.parseFloat(formData.tdspercent) < 0 || Number.parseFloat(formData.tdspercent) > 100) {
      newErrors.tdspercent = "TDS percentage must be between 0 and 100"
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
        startSalary: Number.parseFloat(formData.startSalary),
        endSalary: Number.parseFloat(formData.endSalary),
        tdspercent: Number.parseFloat(formData.tdspercent),
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
          <h2 className="text-xl font-semibold text-gray-800">{initialData ? "Edit TDS Slab" : "Add New TDS Slab"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Salary</label>
            <input
              type="number"
              name="startSalary"
              value={formData.startSalary}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                ${
                  errors.startSalary
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                }`}
              placeholder="Enter start salary"
              step="0.01"
            />
            {errors.startSalary && <p className="mt-1 text-sm text-red-500">{errors.startSalary}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Salary</label>
            <input
              type="number"
              name="endSalary"
              value={formData.endSalary}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                ${
                  errors.endSalary
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                }`}
              placeholder="Enter end salary"
              step="0.01"
            />
            {errors.endSalary && <p className="mt-1 text-sm text-red-500">{errors.endSalary}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TDS Percentage</label>
            <input
              type="number"
              name="tdspercent"
              value={formData.tdspercent}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                ${
                  errors.tdspercent
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                }`}
              placeholder="Enter TDS percentage"
              step="0.01"
              min="0"
              max="100"
            />
            {errors.tdspercent && <p className="mt-1 text-sm text-red-500">{errors.tdspercent}</p>}
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

export default TdsSlabForm;