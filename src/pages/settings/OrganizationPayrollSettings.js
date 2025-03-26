"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiPercent, FiAlertCircle, FiCheck, FiInfo } from "react-icons/fi"
import { orgFixedAllowancesService } from "../../services/orgFixedAllowancesService"
import { orgBasicDaSlabsService } from "../../services/orgBasicDaSlabsService"
import { authService } from "../../services/authService"

function OrganizationPayrollSettings() {
  // Tab state
  const [activeTab, setActiveTab] = useState("basicDaSlabs")

  // Data states
  const [basicDaSlabs, setBasicDaSlabs] = useState([])
  const [fixedAllowances, setFixedAllowances] = useState([])

  // Form states
  const [showBasicDaSlabForm, setShowBasicDaSlabForm] = useState(false)
  const [showFixedAllowanceForm, setShowFixedAllowanceForm] = useState(false)
  const [editingBasicDaSlab, setEditingBasicDaSlab] = useState(null)
  const [editingFixedAllowance, setEditingFixedAllowance] = useState(null)

  // Basic DA Slab form state
  const [basicDaSlabForm, setBasicDaSlabForm] = useState({
    grossStart: "",
    grossEnd: "",
    basicDaValue: "",
  })

  // Fixed Allowance form state
  const [fixedAllowanceForm, setFixedAllowanceForm] = useState({
    allowanceName: "",
    amount: "",
    description: "",
  })

  // UI states
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  // Get organization ID
  const orgId = authService.getUser()?.orgId

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Fetch both types of data
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [basicDaSlabsData, fixedAllowancesData] = await Promise.all([
        orgBasicDaSlabsService.getAll(orgId),
        orgFixedAllowancesService.getAll(orgId),
      ])

      setBasicDaSlabs(basicDaSlabsData)
      setFixedAllowances(fixedAllowancesData)
    } catch (err) {
      setError("Failed to load payroll settings. Please try again.")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Reset form states
  const resetForms = () => {
    setBasicDaSlabForm({
      grossStart: "",
      grossEnd: "",
      basicDaValue: "",
    })

    setFixedAllowanceForm({
      allowanceName: "",
      amount: "",
      description: "",
    })

    setEditingBasicDaSlab(null)
    setEditingFixedAllowance(null)
  }

  // Handle Basic DA Slab form input changes
  const handleBasicDaSlabChange = (e) => {
    const { name, value } = e.target
    setBasicDaSlabForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle Fixed Allowance form input changes
  const handleFixedAllowanceChange = (e) => {
    const { name, value } = e.target
    setFixedAllowanceForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Submit Basic DA Slab form
  const handleBasicDaSlabSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError(null)

      // Validate form
      if (!basicDaSlabForm.grossStart || !basicDaSlabForm.grossEnd || !basicDaSlabForm.basicDaValue) {
        setError("All fields are required")
        setSubmitting(false)
        return
      }

      // Convert string values to numbers
      const formData = {
        ...basicDaSlabForm,
        grossStart: Number.parseFloat(basicDaSlabForm.grossStart),
        grossEnd: Number.parseFloat(basicDaSlabForm.grossEnd),
        basicDaValue: Number.parseFloat(basicDaSlabForm.basicDaValue),
        org: {
          id: orgId,
        }, // Ensure orgId is included in the correct format
      }

      // Validate ranges
      if (formData.grossStart >= formData.grossEnd) {
        setError("Gross Start must be less than Gross End")
        setSubmitting(false)
        return
      }

      // Check for overlapping ranges
      const hasOverlap = basicDaSlabs.some((slab) => {
        // Skip the current slab if we're editing
        if (editingBasicDaSlab && slab.id === editingBasicDaSlab.id) {
          return false
        }

        // Check for overlap
        return (
          (formData.grossStart >= slab.grossStart && formData.grossStart <= slab.grossEnd) ||
          (formData.grossEnd >= slab.grossStart && formData.grossEnd <= slab.grossEnd) ||
          (formData.grossStart <= slab.grossStart && formData.grossEnd >= slab.grossEnd)
        )
      })

      if (hasOverlap) {
        setError("This range overlaps with an existing slab")
        setSubmitting(false)
        return
      }

      if (editingBasicDaSlab) {
        // Update existing slab
        await orgBasicDaSlabsService.update(editingBasicDaSlab.id, formData)
        setSuccessMessage("Basic DA Slab updated successfully")
      } else {
        // Create new slab
        await orgBasicDaSlabsService.create(formData, orgId)
        setSuccessMessage("Basic DA Slab added successfully")
      }

      // Refetch data to ensure we have the latest from the server
      await fetchData()

      // Reset form and close modal
      resetForms()
      setShowBasicDaSlabForm(false)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err.message || "Failed to save Basic DA Slab")
      console.error("Error submitting Basic DA Slab:", err)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Fixed Allowance form
  const handleFixedAllowanceSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError(null)

      // Validate form
      if (!fixedAllowanceForm.allowanceName || !fixedAllowanceForm.amount) {
        setError("Name and amount are required")
        setSubmitting(false)
        return
      }

      // Convert string values to numbers
      const formData = {
        ...fixedAllowanceForm,
        amount: Number.parseFloat(fixedAllowanceForm.amount),
        org: {
          id: orgId,
        }, // Ensure orgId is included in the correct format
      }

      if (editingFixedAllowance) {
        // Update existing allowance
        await orgFixedAllowancesService.update(editingFixedAllowance.id, formData)
        setSuccessMessage("Fixed Allowance updated successfully")
      } else {
        // Create new allowance
        await orgFixedAllowancesService.create(formData, orgId)
        setSuccessMessage("Fixed Allowance added successfully")
      }

      // Refetch data to ensure we have the latest from the server
      await fetchData()

      // Reset form and close modal
      resetForms()
      setShowFixedAllowanceForm(false)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err.message || "Failed to save Fixed Allowance")
      console.error("Error submitting Fixed Allowance:", err)
    } finally {
      setSubmitting(false)
    }
  }

  // Edit Basic DA Slab
  const handleEditBasicDaSlab = (slab) => {
    setEditingBasicDaSlab(slab)
    setBasicDaSlabForm({
      grossStart: slab.grossStart.toString(),
      grossEnd: slab.grossEnd.toString(),
      basicDaValue: slab.basicDaValue.toString(),
    })
    setShowBasicDaSlabForm(true)
  }

  // Edit Fixed Allowance
  const handleEditFixedAllowance = (allowance) => {
    setEditingFixedAllowance(allowance)
    setFixedAllowanceForm({
      allowanceName: allowance.allowanceName,
      amount: allowance.amount.toString(),
      description: allowance.description || "",
    })
    setShowFixedAllowanceForm(true)
  }

  // Delete Basic DA Slab
  const handleDeleteBasicDaSlab = async (id) => {
    try {
      setSubmitting(true)

      await orgBasicDaSlabsService.delete(id)

      // Refetch data instead of updating local state
      await fetchData()

      setSuccessMessage("Basic DA Slab deleted successfully")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err.message || "Failed to delete Basic DA Slab")
      console.error("Error deleting Basic DA Slab:", err)
    } finally {
      setSubmitting(false)
      setShowDeleteConfirm(null)
    }
  }

  // Delete Fixed Allowance
  const handleDeleteFixedAllowance = async (id) => {
    try {
      setSubmitting(true)

      await orgFixedAllowancesService.delete(id)

      // Refetch data instead of updating local state
      await fetchData()

      setSuccessMessage("Fixed Allowance deleted successfully")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err.message || "Failed to delete Fixed Allowance")
      console.error("Error deleting Fixed Allowance:", err)
    } finally {
      setSubmitting(false)
      setShowDeleteConfirm(null)
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Organization Payroll Settings</h1>
            <p className="text-gray-500 mt-1">Configure organization-wide payroll policies and rules</p>
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 flex items-center"
            >
              <FiCheck className="w-5 h-5 mr-2" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center"
            >
              <FiAlertCircle className="w-5 h-5 mr-2" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("basicDaSlabs")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "basicDaSlabs"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiPercent className="w-4 h-4" />
              Basic DA Slabs
            </button>
            <button
              onClick={() => setActiveTab("fixedAllowances")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "fixedAllowances"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiDollarSign className="w-4 h-4" />
              Fixed Allowances
            </button>
          </div>
        </div>

        {/* Basic DA Slabs Tab Content */}
        {activeTab === "basicDaSlabs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiInfo className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-600">
                  Basic DA slabs determine the Basic + DA component based on the employee's gross salary range.
                </p>
              </div>
              <button
                onClick={() => {
                  resetForms()
                  setShowBasicDaSlabForm(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <FiPlus className="w-4 h-4" />
                Add Slab
              </button>
            </div>

            {/* Basic DA Slabs Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Salary Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Basic + DA Value
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {basicDaSlabs.length > 0 ? (
                      basicDaSlabs
                        .sort((a, b) => a.grossStart - b.grossStart)
                        .map((slab) => (
                          <tr key={slab.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {formatCurrency(slab.grossStart)} - {formatCurrency(slab.grossEnd)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {formatCurrency(slab.basicDaValue)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={() => handleEditBasicDaSlab(slab)}
                                  className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded-full transition-colors"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: "basicDaSlab", id: slab.id })}
                                  className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-colors"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                          No Basic DA Slabs defined yet. Click "Add Slab" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Allowances Tab Content */}
        {activeTab === "fixedAllowances" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiInfo className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-600">
                  Fixed allowances are standard components added to all employees' salary structure.
                </p>
              </div>
              <button
                onClick={() => {
                  resetForms()
                  setShowFixedAllowanceForm(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <FiPlus className="w-4 h-4" />
                Add Allowance
              </button>
            </div>

            {/* Fixed Allowances Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allowance Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fixedAllowances.length > 0 ? (
                      fixedAllowances.map((allowance) => (
                        <tr key={allowance.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{allowance.allowanceName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(allowance.amount)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{allowance.description || "-"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => handleEditFixedAllowance(allowance)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded-full transition-colors"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: "fixedAllowance", id: allowance.id })}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No Fixed Allowances defined yet. Click "Add Allowance" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Basic DA Slab Form Modal */}
        <AnimatePresence>
          {showBasicDaSlabForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowBasicDaSlabForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                  {editingBasicDaSlab ? "Edit Basic DA Slab" : "Add Basic DA Slab"}
                </h2>

                <form onSubmit={handleBasicDaSlabSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="grossStart" className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Salary Start
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        id="grossStart"
                        name="grossStart"
                        value={basicDaSlabForm.grossStart}
                        onChange={handleBasicDaSlabChange}
                        min="0"
                        step="1" // Allow any value, not just multiples of 1000
                        required
                        className="pl-7 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2.5 transition-colors"
                        placeholder="Enter amount"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter exact value (e.g., 10001)</p>
                  </div>

                  <div>
                    <label htmlFor="grossEnd" className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Salary End
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        id="grossEnd"
                        name="grossEnd"
                        value={basicDaSlabForm.grossEnd}
                        onChange={handleBasicDaSlabChange}
                        min="0"
                        step="1" // Allow any value, not just multiples of 1000
                        required
                        className="pl-7 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2.5 transition-colors"
                        placeholder="Enter amount"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter exact value (e.g., 20000)</p>
                  </div>

                  <div>
                    <label htmlFor="basicDaValue" className="block text-sm font-medium text-gray-700 mb-1">
                      Basic + DA Value
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        id="basicDaValue"
                        name="basicDaValue"
                        value={basicDaSlabForm.basicDaValue}
                        onChange={handleBasicDaSlabChange}
                        min="0"
                        step="1" // Allow any value, not just multiples of 1000
                        required
                        className="pl-7 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2.5 transition-colors"
                        placeholder="Enter amount"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter exact value for this salary range</p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t mt-2">
                    <button
                      type="button"
                      onClick={() => setShowBasicDaSlabForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Allowance Form Modal */}
        <AnimatePresence>
          {showFixedAllowanceForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowFixedAllowanceForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                  {editingFixedAllowance ? "Edit Fixed Allowance" : "Add Fixed Allowance"}
                </h2>

                <form onSubmit={handleFixedAllowanceSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="allowanceName" className="block text-sm font-medium text-gray-700 mb-1">
                      Allowance Name
                    </label>
                    <input
                      type="text"
                      id="allowanceName"
                      name="allowanceName"
                      value={fixedAllowanceForm.allowanceName}
                      onChange={handleFixedAllowanceChange}
                      required
                      className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2.5 px-3 transition-colors"
                      placeholder="e.g., Conveyance, Medical, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={fixedAllowanceForm.amount}
                        onChange={handleFixedAllowanceChange}
                        min="0"
                        step="1" // Allow any value, not just multiples of 100
                        required
                        className="pl-7 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2.5 transition-colors"
                        placeholder="Enter amount"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter exact amount for this allowance</p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={fixedAllowanceForm.description}
                      onChange={handleFixedAllowanceChange}
                      rows="3"
                      className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2.5 px-3 transition-colors"
                      placeholder="Brief description of this allowance"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t mt-2">
                    <button
                      type="button"
                      onClick={() => setShowFixedAllowanceForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Confirm Delete</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Are you sure you want to delete this{" "}
                    {showDeleteConfirm.type === "basicDaSlab" ? "Basic DA Slab" : "Fixed Allowance"}? This action cannot
                    be undone.
                  </p>
                </div>

                <div className="mt-5 flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showDeleteConfirm.type === "basicDaSlab"
                        ? handleDeleteBasicDaSlab(showDeleteConfirm.id)
                        : handleDeleteFixedAllowance(showDeleteConfirm.id)
                    }
                    disabled={submitting}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Deleting...
                      </div>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default OrganizationPayrollSettings;