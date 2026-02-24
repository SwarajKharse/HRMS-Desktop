"use client"

import { useState, useEffect } from "react"
import SmartCalendar from "./SmartCalendar"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"

const PurchaseInvoiceForm = ({ invoice, onSubmit, onCancel, loading = false, error = null, success = null }) => {
  const [formData, setFormData] = useState({
    status: invoice?.status || "",
    paymentCycle: invoice?.paymentCycle || "",
    expectedPaymentDate: invoice?.expectedPaymentDate || "",
    payableAmount: invoice?.payableAmount || "",
  })

  const [paymentCycles, setPaymentCycles] = useState([])
  const [showCalendar, setShowCalendar] = useState(false)

  const statusOptions = [
    { value: "Approve", label: "Approve" },
    { value: "In progress", label: "In progress" },
    { value: "Revision from Purchase", label: "Revision from Purchase" },
  ]

  useEffect(() => {
    fetchPaymentCycles()
  }, [])

  const fetchPaymentCycles = async () => {
    try {
      console.log("[v0] Starting to fetch payment cycles...")
      const cycles = await purchaseInvoiceService.getPaymentCycles()
      console.log("[v0] Received payment cycles:", cycles)
      setPaymentCycles(cycles)
    } catch (error) {
      console.error("Error fetching payment cycles:", error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDateSelect = (date) => {
    handleInputChange("expectedPaymentDate", date)
    setShowCalendar(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const submissionData = {
      ...formData,
      payableAmount: String(formData.payableAmount),
    }
    await onSubmit(submissionData)
  }

  const getPaymentCycleOptions = () => {
    console.log("[v0] Creating payment cycle options from:", paymentCycles)
    const options = paymentCycles.map((cycle) => ({
      value: cycle.day,
      label: cycle.day,
    }))

    // Add Urgent option
    options.push({ value: "Urgent", label: "Urgent" })

    console.log("[v0] Final payment cycle options:", options)
    return options
  }

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Update Purchase Invoice</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Cycle Selection - Hidden when Status is "Revision from Purchase" */}
            {formData.status !== "Revision from Purchase" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Cycle</label>
                <select
                  value={formData.paymentCycle}
                  onChange={(e) => handleInputChange("paymentCycle", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Payment Cycle</option>
                  {getPaymentCycleOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Expected Payment Date - Hidden when Status is "Revision from Purchase" */}
            {formData.status !== "Revision from Purchase" && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Payment Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDateForDisplay(formData.expectedPaymentDate)}
                    onClick={() => setShowCalendar(true)}
                    placeholder="Select date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    readOnly
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>

                {showCalendar && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (e.target === e.currentTarget) {
                        setShowCalendar(false)
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <SmartCalendar
                        paymentCycle={formData.paymentCycle}
                        onDateSelect={handleDateSelect}
                        onClose={() => setShowCalendar(false)}
                        selectedDate={formData.expectedPaymentDate}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Amount - Hidden when Status is "Revision from Purchase" */}
            {formData.status !== "Revision from Purchase" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payableAmount}
                    onChange={(e) => handleInputChange("payableAmount", e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Invoice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PurchaseInvoiceForm