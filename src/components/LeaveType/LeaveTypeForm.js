import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiX, FiAlertCircle, FiImage } from "react-icons/fi";
import { leaveTypeService } from "../../services/leaveTypeService";

function LeaveTypeForm({ leaveType, orgId, onClose, onSubmit }) {
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    leaveCategory: "Paid",
    balanceBasedOn: "Fixed entitlement",
    unit: "Days",
    description: "",
    org: {
      id: orgId,
    },
    entitlement: {
      effectiveAfterCount: 0,
      effectiveAfterUnit: "years",
      effectiveAfterFrom: "date of joining",
      accrualOn: false,
      accrualCount: 12,
      accrualUnit: "yearly",
      accrualDate: "1st",
      accrualMonth: "January",
      accrualIn: "Current accrual",
      resetOn: false,
      resetUnit: "yearly",
      resetDate: "last day",
      resetMonth: "December",
      carryOn: false,
      carryType: "Carry forward",
      carryCount: 30,
      carryUnit: "days",
      encashOn: false,
      encashCount: 0,
      encashUnit: "days",
      weekendsBetween: false,
      weekendsBetweenCount: 0,
      holidaysBetween: false,
      holidaysBetweenCount: 0,
    },
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leaveType) {
      setFormData({
        ...leaveType,
        org: { id: orgId },
      });
    }
  }, [leaveType, orgId]);

  const handleChange = (e, section = "main") => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section === "main" ? name : "entitlement"]:
        section === "main"
          ? type === "checkbox"
            ? checked
            : value
          : {
              ...prev.entitlement,
              [name]: type === "checkbox" ? checked : value,
            },
    }))
    if (error) setError("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (leaveType?.id) {
        await leaveTypeService.updateLeaveType(formData);
      } else {
        await leaveTypeService.createLeaveType(formData);
      }

      if (onSubmit) await onSubmit();
      onClose()
    } catch (err) {
      setError(err.message || "Failed to save leave type");
    } finally {
      setLoading(false);
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
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold">{leaveType ? "Edit Leave Policy" : "Add Leave Policy"}</h2>
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

        <div className="border-b">
          <nav className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "entitlement"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("entitlement")}
            >
              Entitlement
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {activeTab === "details" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
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
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Balance Based On <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="leaveCategory"
                    required
                    value={formData.balanceBasedOn}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="Fixed entitlement">Fixed entitlement</option>
                    <option value="Leave Grant">Leave Grant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit"
                    required
                    value={formData.unit}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Effective After Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Effective after</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    name="effectiveAfterCount"
                    min="0"
                    value={formData.entitlement.effectiveAfterCount}
                    onChange={(e) => handleChange(e, "entitlement")}
                    className="block w-24 rounded-md border border-gray-300 px-3 py-2"
                  />
                  <select
                    name="effectiveAfterUnit"
                    value={formData.entitlement.effectiveAfterUnit}
                    onChange={(e) => handleChange(e, "entitlement")}
                    className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="years">years</option>
                    <option value="months">months</option>
                  </select>
                  <span className="text-gray-500">from</span>
                  <select
                    name="effectiveAfterFrom"
                    value={formData.entitlement.effectiveAfterFrom}
                    onChange={(e) => handleChange(e, "entitlement")}
                    className="block w-48 rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="date of joining">date of joining</option>
                    <option value="date of confirmation">date of confirmation</option>
                  </select>
                </div>
              </div>

              {/* Accrual Section */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="accrualOn"
                    checked={formData.entitlement.accrualOn}
                    onChange={(e) => handleChange(e, "entitlement")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">Accrual</label>
                </div>
                {formData.entitlement.accrualOn && (
                  <div className="ml-6 space-y-4">
                    <p className="text-sm text-gray-500">Define how much and when leave gets credited to an employee</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-700">Credit</span>
                      <input
                        type="number"
                        name="accrualCount"
                        min="0"
                        value={formData.entitlement.accrualCount}
                        onChange={(e) => handleChange(e, "entitlement")}
                        className="block w-20 rounded-md border border-gray-300 px-3 py-2"
                      />
                      <span className="text-sm text-gray-700">days</span>
                      <select
                        name="accrualUnit"
                        value={formData.entitlement.accrualUnit}
                        onChange={(e) => handleChange(e, "entitlement")}
                        className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="yearly">yearly</option>
                        <option value="monthly">monthly</option>
                        <option value="quarterly">quarterly</option>
                      </select>
                      <span className="text-sm text-gray-700">on</span>
                      <select
                        name="accrualDate"
                        value={formData.entitlement.accrualDate}
                        onChange={(e) => handleChange(e, "entitlement")}
                        className="block w-24 rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="1st">1st</option>
                        <option value="15th">15th</option>
                        <option value="last">last</option>
                      </select>
                      <span className="text-sm text-gray-700">of</span>
                      <select
                        name="accrualMonth"
                        value={formData.entitlement.accrualMonth}
                        onChange={(e) => handleChange(e, "entitlement")}
                        className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        {/* Add other months */}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Section */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="resetOn"
                    checked={formData.entitlement.resetOn}
                    onChange={(e) => handleChange(e, "entitlement")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">Reset</label>
                </div>
                {formData.entitlement.resetOn && (
                  <div className="ml-6 space-y-4">
                    <p className="text-sm text-gray-500">
                      Define the reset, carry forward and encashment of leave balance
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-700">Reset</span>
                      <select
                        name="resetUnit"
                        value={formData.entitlement.resetUnit}
                        onChange={(e) => handleChange(e, "entitlement")}
                        className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="yearly">yearly</option>
                        <option value="monthly">monthly</option>
                        <option value="quarterly">quarterly</option>
                      </select>
                      <span className="text-sm text-gray-700">on</span>
                      <select
                        name="resetDate"
                        value={formData.entitlement.resetDate}
                        onChange={(e) => handleChange(e, "entitlement")}
                        className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="first day">first day</option>
                        <option value="last day">last day</option>
                      </select>
                      <span className="text-sm text-gray-700">of</span>
                      <select
                        name="resetMonth"
                        value={formData.entitlement.resetMonth}
                        onChange={(e) => handleChange(e, "entitlement")}
                        className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="December">December</option>
                        <option value="March">March</option>
                        {/* Add other months */}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="carryOn"
                          checked={formData.entitlement.carryOn}
                          onChange={(e) => handleChange(e, "entitlement")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-700">
                          Carry forward unused leave
                        </label>
                      </div>
                      {formData.entitlement.carryOn && (
                        <div className="ml-6 flex items-center gap-4">
                          <select
                            name="carryType"
                            value={formData.entitlement.carryType}
                            onChange={(e) => handleChange(e, "entitlement")}
                            className="block w-48 rounded-md border border-gray-300 px-3 py-2"
                          >
                            <option value="Carry forward">Carry forward</option>
                            <option value="Carry forward with expiry">Carry forward with expiry</option>
                          </select>
                          <input
                            type="number"
                            name="carryCount"
                            min="0"
                            value={formData.entitlement.carryCount}
                            onChange={(e) => handleChange(e, "entitlement")}
                            className="block w-20 rounded-md border border-gray-300 px-3 py-2"
                          />
                          <select
                            name="carryUnit"
                            value={formData.entitlement.carryUnit}
                            onChange={(e) => handleChange(e, "entitlement")}
                            className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                          >
                            <option value="days">days</option>
                            <option value="hours">hours</option>
                          </select>
                        </div>
                      )}

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="encashOn"
                          checked={formData.entitlement.encashOn}
                          onChange={(e) => handleChange(e, "entitlement")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-700">Encash unused leave</label>
                      </div>
                      {formData.entitlement.encashOn && (
                        <div className="ml-6 flex items-center gap-4">
                          <input
                            type="number"
                            name="encashCount"
                            min="0"
                            value={formData.entitlement.encashCount}
                            onChange={(e) => handleChange(e, "entitlement")}
                            className="block w-20 rounded-md border border-gray-300 px-3 py-2"
                          />
                          <select
                            name="encashUnit"
                            value={formData.entitlement.encashUnit}
                            onChange={(e) => handleChange(e, "entitlement")}
                            className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                          >
                            <option value="days">days</option>
                          </select>
                        </div>
                      )}

                    <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="weekendsBetween"
                          checked={formData.entitlement.weekendsBetween}
                          onChange={(e) => handleChange(e, "entitlement")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-700">Weekends Between</label>
                      </div>
                      {formData.entitlement.weekendsBetween && (
                        <div className="ml-6 flex items-center gap-4">
                          <input
                            type="number"
                            name="weekendsBetweenCount"
                            min="0"
                            value={formData.entitlement.weekendsBetweenCount}
                            onChange={(e) => handleChange(e, "entitlement")}
                            className="block w-20 rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                      )}

                    <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="holidaysBetween"
                          checked={formData.entitlement.holidaysBetween}
                          onChange={(e) => handleChange(e, "entitlement")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-700">Holidays Between</label>
                      </div>
                      {formData.entitlement.holidaysBetween && (
                        <div className="ml-6 flex items-center gap-4">
                          <input
                            type="number"
                            name="holidaysBetweenCount"
                            min="0"
                            value={formData.entitlement.holidaysBetweenCount}
                            onChange={(e) => handleChange(e, "entitlement")}
                            className="block w-20 rounded-md border border-gray-300 px-3 py-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t">
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
                "Update Leave Policy"
              ) : (
                "Create Leave Policy"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default LeaveTypeForm;