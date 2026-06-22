"use client"

import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { projectService } from "../../services/projectService"

function ProjectSummary({ projectId, onClose }) {
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState({})
  const [expanded, setExpanded] = useState({})

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
            
            {!summaryData.categorySummary || !Array.isArray(summaryData.categorySummary) || summaryData.categorySummary.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                No products found for this project
              </div>
            ) : (
              <div className="space-y-4">
                {summaryData.categorySummary.map((category, catIdx) => {
                  const catOpen = !!expandedCategory[catIdx]
                  return (
                    <div key={catIdx} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory((p) => ({ ...p, [catIdx]: !p[catIdx] }))}
                        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 text-indigo-800 font-semibold text-sm hover:bg-indigo-100 transition-colors"
                      >
                        <span>{category.categoryLabel}</span>
                        <span>{catOpen ? "▾" : "▸"}</span>
                      </button>
                      {catOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="px-3 py-3 text-left font-semibold text-gray-700 min-w-48"></th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-700 min-w-48">Product Name</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">BOQ Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Remaining Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total MTR Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total Stock Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total Purchase Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Total DC Qty</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.products.map((product, idx) => {
                      const hasSubItems = Array.isArray(product.categoryItems) && product.categoryItems.length > 0
                      const isOpen = !!expanded[`${catIdx}-${idx}`]
                      const pending = Math.max(0, (product.totalMTRQty || 0) - (product.totalDCQty || 0))
                      return (
                        <>
                          <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors`}>
                            <td className="px-3 py-3 text-center">
                              {hasSubItems && (
                                <button onClick={() => setExpanded((p) => ({ ...p, [`${catIdx}-${idx}`]: !p[`${catIdx}-${idx}`] }))} className="text-gray-500">
                                  {isOpen ? "▾" : "▸"}
                                </button>
                              )}
                            </td>
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
                            <td className={`px-3 py-3 text-center font-semibold ${pending > 0 ? "text-red-600" : "text-gray-400"}`}>{pending}</td>
                          </tr>
                          {isOpen && hasSubItems && product.categoryItems.map((ci, ciIdx) => {
                            const ciPending = Math.max(0, (ci.totalMTRQty || 0) - (ci.totalDCQty || 0))
                            return (
                              <tr key={`${idx}-${ciIdx}`} className="border-b border-gray-100 bg-gray-50/50">
                                <td className="px-3 py-2"></td>
                                <td className="px-3 py-2 text-gray-600 text-left pl-6">
                                  <span className="text-[10px] uppercase tracking-wide text-gray-400 mr-2">{ci.categoryType}</span>
                                  {ci.itemName}
                                </td>
                                <td className="px-3 py-2 text-center text-blue-500">{ci.qty || 0}</td>
                                <td className="px-3 py-2 text-center text-gray-400">—</td>
                                <td className="px-3 py-2 text-center text-purple-500">{ci.totalMTRQty || 0}</td>
                                <td className="px-3 py-2 text-center text-green-500">{ci.totalStockQty || 0}</td>
                                <td className="px-3 py-2 text-center text-red-500">{ci.totalPurchaseQty || 0}</td>
                                <td className="px-3 py-2 text-center text-indigo-500">{ci.totalDCQty || 0}</td>
                                <td className={`px-3 py-2 text-center ${ciPending > 0 ? "text-red-500" : "text-gray-400"}`}>{ciPending}</td>
                              </tr>
                            )
                          })}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default ProjectSummary