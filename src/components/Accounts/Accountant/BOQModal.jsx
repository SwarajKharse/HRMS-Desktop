"use client"

import { useState, useEffect } from "react"
import { FiAlertCircle, FiX } from "react-icons/fi"
import { receivableService } from "../../../services/receivableService"

function BOQModal({ isOpen, onClose, projectId }) {
  const [boqData, setBOQData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && projectId) {
      fetchBOQData()
    }
  }, [isOpen, projectId])

  const fetchBOQData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await receivableService.getProjectBOQ(projectId)
      setBOQData(data)
    } catch (err) {
      setError("Failed to fetch BOQ data")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">BOQ Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {boqData && !loading && (
            <div className="space-y-6">
              {/* BOQ Header */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-2">{boqData.projectName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">Total Supply Amount:</span>
                    <div className="text-lg font-semibold">₹{boqData.totalSupplyAmount?.toFixed(2) || "0.00"}</div>
                  </div>
                  <div>
                    <span className="font-medium text-amber-600">Total Installation Amount:</span>
                    <div className="text-lg font-semibold">
                      ₹{boqData.totalInstallationAmount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Grand Total:</span>
                    <div className="text-xl font-bold">₹{boqData.grandTotal?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>
              </div>

              {/* BOQ Items */}
              {boqData.items && boqData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Make
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supply Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Installation Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supply Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Installation Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {boqData.items.map((item, index) => (
                        <tr key={item.id || index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.productName || "Unknown Product"}
                            </div>
                            <div className="text-xs text-gray-500">HSN: {item.hsnCode || "N/A"}</div>
                            <div className="text-xs text-gray-400">UOM: {item.uom || "N/A"}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.categoryName || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.make || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.qty || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">₹{item.supplyRate?.toFixed(2) || "0.00"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₹{item.installationRate?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₹{item.supplyAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₹{item.installationAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ₹{item.total?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No BOQ items found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BOQModal
