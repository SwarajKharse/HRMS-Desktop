'use client';

import { useState, useEffect } from "react"
import { FiX, FiSave } from "react-icons/fi"
import { paymentCycleService } from "../../services/paymentCycleService"

const PaymentCycleList = () => {
  const [paymentCycles, setPaymentCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch all payment cycles
  const fetchPaymentCycles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await paymentCycleService.getAllPaymentCycles()
      if (response && response.data) {
        // If no cycles exist, initialize them
        if (response.data.length === 0) {
          await initializePaymentCycles()
        } else {
          setPaymentCycles(response.data)
          setHasChanges(false)
        }
      } else {
        setError("Invalid response format from server")
      }
    } catch (error) {
      console.error("Error fetching payment cycles:", error)
      setError("Failed to fetch payment cycles: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  // Initialize payment cycles (one-time setup)
  const initializePaymentCycles = async () => {
    try {
      setLoading(true)
      const response = await paymentCycleService.initializePaymentCycles()
      if (response && response.data) {
        // Handle nested data structure from backend
        const cyclesData = response.data.data || response.data
        const cyclesArray = Array.isArray(cyclesData) ? cyclesData : []
        setPaymentCycles(cyclesArray)
        setSuccessMessage("Payment cycles initialized with all 7 days!")
        setTimeout(() => setSuccessMessage(null), 3000)
        setHasChanges(false)
      }
    } catch (error) {
      console.error("Error initializing payment cycles:", error)
      setError("Failed to initialize payment cycles: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchPaymentCycles()
  }, [])

  // Handle toggle status
  const handleToggleStatus = (index) => {
    const updatedCycles = [...paymentCycles]
    updatedCycles[index].status = updatedCycles[index].status === "ENABLED" ? "DISABLE" : "ENABLED"
    setPaymentCycles(updatedCycles)
    setHasChanges(true)
  }

  // Handle save all changes
  const handleSaveChanges = async () => {
    try {
      setLoading(true)
      setError(null)
      await paymentCycleService.updatePaymentCycles(paymentCycles)
      setHasChanges(false)
      setSuccessMessage("Payment cycles updated successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error saving payment cycles:", error)
      setError("Failed to save payment cycles: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  // Handle discard changes
  const handleDiscardChanges = () => {
    fetchPaymentCycles()
    setHasChanges(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Payment Cycle Configuration</h1>
        {hasChanges && (
          <div className="flex gap-2">
            <button
              onClick={handleSaveChanges}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <FiSave size={18} />
              Save Changes
            </button>
            <button
              onClick={handleDiscardChanges}
              disabled={loading}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-3 border border-green-100">
          <span className="font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-500 hover:text-green-700">
            <FiX />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <FiX />
          </button>
        </div>
      )}

      {/* Payment Cycles Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading && paymentCycles.length === 0 ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : paymentCycles.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No payment cycles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentCycles.map((cycle, index) => (
                  <tr key={cycle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{cycle.day}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cycle.status === "ENABLED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cycle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(index)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          cycle.status === "ENABLED"
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-green-100 text-green-600 hover:bg-green-200"
                        }`}
                      >
                        {cycle.status === "ENABLED" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-medium mb-2">Note:</p>
        <p>Toggle the status of each day and click "Save Changes" to apply all modifications at once.</p>
      </div>
    </div>
  )
}

export default PaymentCycleList