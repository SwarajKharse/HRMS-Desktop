"use client"

import { useState, useEffect } from "react"
import { FiX, FiChevronDown, FiChevronUp, FiPlus, FiTrash2 } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import { comparisonSheetService } from "../../../services/comparisonSheetService"

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function ComparisionSheetModal({ mtr, onClose, onSave }) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(true)
  const [comparisons, setComparisons] = useState([
    { id: 1, vendorName: "", qty: mtr?.purchaseMTR || 0, rate: 0, value: 0, leadTime: "" },
    { id: 2, vendorName: "", qty: mtr?.purchaseMTR || 0, rate: 0, value: 0, leadTime: "" },
    { id: 3, vendorName: "", qty: mtr?.purchaseMTR || 0, rate: 0, value: 0, leadTime: "" },
  ])
  const [selectedVendor, setSelectedVendor] = useState("")
  const [loading, setSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchExistingData = async () => {
      if (!mtr?.id) return

      setIsLoadingData(true)
      setError("")
      try {
        const existingDataArray = await comparisonSheetService.getComparisonSheet(mtr.id)
        console.log("[v0] Raw API response:", JSON.stringify(existingDataArray, null, 2))
        console.log("[v0] Response type:", typeof existingDataArray)
        console.log("[v0] Is array:", Array.isArray(existingDataArray))

        let parsedData = existingDataArray
        if (typeof existingDataArray === "string") {
          try {
            parsedData = JSON.parse(existingDataArray)
            console.log("[v0] Parsed JSON data:", JSON.stringify(parsedData, null, 2))
          } catch (parseError) {
            console.error("[v0] Error parsing JSON:", parseError)
            setError("Error parsing comparison sheet data")
            return
          }
        }

        if (parsedData && parsedData.length > 0) {
          const existingData = parsedData[parsedData.length - 1]
          console.log("[v0] Selected comparison sheet:", JSON.stringify(existingData, null, 2))
          console.log("[v0] ComparisonItems:", existingData.comparisonItems)
          console.log("[v0] ComparisonItems length:", existingData.comparisonItems?.length)

          if (existingData.comparisonItems && existingData.comparisonItems.length > 0) {
            console.log("[v0] First comparison item:", JSON.stringify(existingData.comparisonItems[0], null, 2))

            const loadedComparisons = existingData.comparisonItems.map((item, index) => {
              console.log(`[v0] Processing item ${index}:`, JSON.stringify(item, null, 2))
              const mapped = {
                id: index + 1,
                vendorName: item.vendorName || "",
                qty: item.quantity || mtr?.purchaseMTR || 0, // Backend uses 'quantity', frontend uses 'qty'
                rate: item.rate || 0,
                value: item.value || 0,
                leadTime: item.leadTime || "",
              }
              console.log(`[v0] Mapped item ${index}:`, JSON.stringify(mapped, null, 2))
              return mapped
            })

            while (loadedComparisons.length < 3) {
              loadedComparisons.push({
                id: loadedComparisons.length + 1,
                vendorName: "",
                qty: mtr?.purchaseMTR || 0,
                rate: 0,
                value: 0,
                leadTime: "",
              })
            }

            console.log("[v0] Final loaded comparisons:", JSON.stringify(loadedComparisons, null, 2))
            setComparisons(loadedComparisons)
          } else {
            console.log("[v0] No comparison items found or empty array")
          }

          if (existingData.selectedVendor) {
            console.log("[v0] Setting selected vendor:", existingData.selectedVendor)
            setSelectedVendor(existingData.selectedVendor)
          } else {
            console.log("[v0] No selected vendor found")
          }
        } else {
          console.log("[v0] No existing data found or empty array")
        }
      } catch (error) {
        console.error("[v0] Error fetching existing comparison sheet:", error)
        setError("Failed to load existing comparison data")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchExistingData()
  }, [mtr?.id, mtr?.purchaseMTR])

  const updateComparison = (id, field, value) => {
    setComparisons((prev) =>
      prev.map((comp) => {
        if (comp.id === id) {
          const updated = { ...comp, [field]: value }
          if (field === "qty" || field === "rate") {
            updated.value = (Number.parseFloat(updated.qty) || 0) * (Number.parseFloat(updated.rate) || 0)
          }
          return updated
        }
        return comp
      }),
    )
  }

  const addComparison = () => {
    const newId = Math.max(...comparisons.map((c) => c.id)) + 1
    setComparisons((prev) => [
      ...prev,
      {
        id: newId,
        vendorName: "",
        qty: mtr?.purchaseMTR || 0,
        rate: 0,
        value: 0,
        leadTime: "",
      },
    ])
  }

  const removeComparison = (id) => {
    if (comparisons.length > 3) {
      setComparisons((prev) => prev.filter((comp) => comp.id !== id))
    }
  }

  const vendorOptions = comparisons
    .filter((comp) => comp.vendorName.trim() !== "")
    .map((comp) => comp.vendorName.trim())

  const handleSave = async () => {
    setError("")
    setSuccess("")

    const invalidComparisons = comparisons.filter((comp) => !comp.vendorName.trim())
    if (invalidComparisons.length > 0) {
      setError("Please fill in all vendor names")
      return
    }

    if (!selectedVendor) {
      setError("Please select a vendor")
      return
    }

    setSaving(true)
    try {
      const comparisonData = {
        boqMtrId: mtr.id,
        items: comparisons.map((comp) => ({
          vendorName: comp.vendorName.trim(),
          qty: Number.parseFloat(comp.qty) || 0,
          rate: Number.parseFloat(comp.rate) || 0,
          value: comp.value,
          leadTime: comp.leadTime.trim(),
        })),
        selectedVendor: selectedVendor.trim(),
        createdBy: "1",
      }

      console.log("[v0] Saving comparison data:", comparisonData)

      if (onSave) {
        await onSave(comparisonData)
      }

      setSuccess("Comparison sheet saved successfully!")
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error saving comparison sheet:", error)
      setError("Error saving comparison sheet. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!mtr) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h3 className="text-lg font-bold text-blue-700">
            Comparison Sheet - Material Requisition
            {isLoadingData && <span className="ml-2 text-sm text-blue-500">(Loading...)</span>}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Error and Success Message Display */}
        {(error || success) && (
          <div className={`p-4 ${error ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"} border-b`}>
            <p className={`text-sm ${error ? "text-red-700" : "text-green-700"}`}>{error || success}</p>
          </div>
        )}

        {isLoadingData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading comparison sheet data...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Material Requisition Details - Collapsible */}
            <div className="border-b border-blue-200">
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <h4 className="text-md font-semibold text-blue-600">Material Requisition Details</h4>
                {isDetailsExpanded ? (
                  <FiChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-blue-600" />
                )}
              </button>

              <AnimatePresence>
                {isDetailsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 border-l-4 border-blue-400">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-blue-600">MTR Code:</p>
                          <p className="font-semibold">{mtr.mtrCode || "N/A"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">Product Name:</p>
                          <p className="font-semibold">{mtr.productName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">Project Name:</p>
                          <p className="font-semibold">{mtr.projectName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">MTR Qty:</p>
                          <p>{mtr.mtrQty}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">Purchase MTR:</p>
                          <p className="font-semibold text-blue-600">{mtr.purchaseMTR}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">Priority:</p>
                          <p
                            className={`font-medium ${
                              mtr.priority === "HIGH"
                                ? "text-red-600"
                                : mtr.priority === "MEDIUM"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {mtr.priority}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">Status:</p>
                          <p>{mtr.status}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">Expected Delivery:</p>
                          <p>{formatDate(mtr.expectedDeliveryDate)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comparison Sheet - Collapsible */}
            <div className="border-b border-amber-200">
              <button
                onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <h4 className="text-md font-semibold text-amber-700">Vendor Comparison Sheet</h4>
                {isComparisonExpanded ? (
                  <FiChevronUp className="w-5 h-5 text-amber-600" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-amber-600" />
                )}
              </button>

              <AnimatePresence>
                {isComparisonExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 border-l-4 border-amber-400">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold text-amber-700">Vendor Comparisons</h5>
                        <button
                          onClick={addComparison}
                          className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          <FiPlus className="w-4 h-4" />
                          Add More
                        </button>
                      </div>

                      {/* Comparison Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                                Vendor Name
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Qty</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Rate</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Value</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                                Lead Time
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisons.map((comparison, index) => (
                              <tr key={comparison.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={comparison.vendorName}
                                    onChange={(e) => updateComparison(comparison.id, "vendorName", e.target.value)}
                                    placeholder="Enter vendor name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={comparison.qty}
                                    onChange={(e) => updateComparison(comparison.id, "qty", e.target.value)}
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={comparison.rate}
                                    onChange={(e) => updateComparison(comparison.id, "rate", e.target.value)}
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={comparison.value.toFixed(2)}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={comparison.leadTime}
                                    onChange={(e) => updateComparison(comparison.id, "leadTime", e.target.value)}
                                    placeholder="e.g., 7 days"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {comparisons.length > 3 && (
                                    <button
                                      onClick={() => removeComparison(comparison.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Vendor Selection */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-amber-700 mb-2">Select Vendor for MTR:</label>
                        <select
                          value={selectedVendor}
                          onChange={(e) => setSelectedVendor(e.target.value)}
                          className="w-full max-w-md px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Select Vendor --</option>
                          {vendorOptions.map((vendor, index) => (
                            <option key={index} value={vendor}>
                              {vendor}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save Comparison Sheet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}