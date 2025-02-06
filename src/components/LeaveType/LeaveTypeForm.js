import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { leaveTypeService } from "../../services/leaveTypeService";

function LeaveTypeForm({ leaveType, orgId, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    leaveCategory: "",
    effectiveAfterCount: 0,
    effectiveAfterUnit: "months",
    accrualCount: 0,
    description: "",
    org: {
      id: orgId,
    },
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leaveType) {
      setFormData({
        ...leaveType,
        org: { id: orgId },
      })
    }
  }, [leaveType, orgId]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseInt(value) || 0 : value,
    }))
    if (error) setError("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = leaveTypeService.createLeaveType(formData);
      if(res !== null) {
        onClose();
        onSubmit();
      }
    } catch (err) {
      setError(err.message || "Failed to save leave type");
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  }

  const leaveCategories = ["Paid", "Unpaid"];

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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{leaveType ? "Edit Leave Type" : "Add New Leave Type"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
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

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Leave Type Name <span className="text-red-500">*</span>
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
                Leave Category <span className="text-red-500">*</span>
              </label>
              <select
                name="leaveCategory"
                required
                value={formData.leaveCategory}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select Category</option>
                {leaveCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Effective After</label>
                <input
                  type="number"
                  name="effectiveAfterCount"
                  min="0"
                  value={formData.effectiveAfterCount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Effective Unit</label>
                <select
                  name="effectiveAfterUnit"
                  value={formData.effectiveAfterUnit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Accrual Count</label>
                <input
                  type="number"
                  name="accrualCount"
                  min="0"
                  value={formData.accrualCount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
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
              ) : leaveType ? (
                "Update Leave Type"
              ) : (
                "Create Leave Type"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default LeaveTypeForm;