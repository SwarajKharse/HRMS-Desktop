"use client"

import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { projectService } from "../../services/projectService"

function ProjectSummary({ projectId, onClose }) {
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProjectSummary()
  }, [projectId])

  const fetchProjectSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await projectService.getProjectSummary(projectId)
      console.log("[v0] Project summary data:", data)
      
      // Ensure data has the expected structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server')
      }
      
      setSummaryData(data)
    } catch (err) {
      console.error("[v0] Error fetching project summary:", err)
      setError("Failed to load project summary: " + (err.message || "Unknown error"))
      setSummaryData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-center">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[99vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Project Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 text-center text-red-600 font-medium bg-red-50">
            {error}
          </div>
        )}

        {/* Summary Content */}
        {summaryData && !error && (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-sm text-gray-600 font-semibold">Project: {summaryData.projectName || 'N/A'}</h3>
            </div>
            
            {!summaryData.productSummary || !Array.isArray(summaryData.productSummary) || summaryData.productSummary.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                No products found for this project
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="px-3 py-3 text-left font-semibold text-gray-700 min-w-48">Product Name</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">BOQ Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Remaining Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total MTR Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total Stock Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total Purchase Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total DC Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.productSummary.map((product, idx) => (
                      <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors`}>
                        <td className="px-3 py-3 text-gray-900 font-medium text-left">
                          <div className="truncate max-w-xs" title={product.productName}>
                            {product.productName}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-blue-600 font-semibold">{product.boqQty || 0}</td>
                        <td className="px-3 py-3 text-center text-orange-600 font-semibold">{product.remainingQty || 0}</td>
                        <td className="px-3 py-3 text-center text-purple-600 font-semibold">{product.totalMTRQty || 0}</td>
                        <td className="px-3 py-3 text-center text-green-600 font-semibold">{product.totalStockQty || 0}</td>
                        <td className="px-3 py-3 text-center text-red-600 font-semibold">{product.totalPurchaseQty || 0}</td>
                        <td className="px-3 py-3 text-center text-indigo-600 font-semibold">{product.totalDCQty || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectSummary