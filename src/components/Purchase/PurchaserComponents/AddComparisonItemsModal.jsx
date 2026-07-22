"use client"

import { useState, useEffect, useCallback } from "react"
import { FiX, FiSearch } from "react-icons/fi"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { getErrorMessage } from "../../../utils/errorUtils"

export default function AddComparisonItemsModal({ excludeMtrIds = [], onClose, onAdd }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [projectSearch, setProjectSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState({})

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await comparisonSheetService.getPMApprovedMaterialRequisitions({ size: 200 })
      const content = data.content || data || []
      setItems(
        content.filter((mtr) => !excludeMtrIds.includes(mtr.id) && !mtr.hasComparisonSheet),
      )
    } catch (e) {
      console.error("Error loading items for comparison sheet:", e)
      setError(getErrorMessage(e, "Failed to load pending items."))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const toggle = (id) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleAdd = () => {
    const selected = items.filter((mtr) => selectedIds[mtr.id])
    onAdd(selected)
    onClose()
  }

  const selectedCount = Object.values(selectedIds).filter(Boolean).length

  const visibleItems = items.filter((mtr) => {
    if (search) {
      const q = search.toLowerCase()
      const matchesName = (mtr.productName || "").toLowerCase().includes(q)
      const matchesCode = (mtr.productCode || "").toLowerCase().includes(q)
      if (!matchesName && !matchesCode) return false
    }
    if (projectSearch && !(mtr.projectName || "").toLowerCase().includes(projectSearch.toLowerCase())) return false
    return true
  })

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h3 className="text-lg font-bold text-blue-700">Add Items to Comparison</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item name or code..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Filter by project name..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading items...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : visibleItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No pending items found.</div>
          ) : (
            <div className="space-y-1">
              {visibleItems.map((mtr) => (
                <label
                  key={mtr.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={!!selectedIds[mtr.id]}
                    onChange={() => toggle(mtr.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {mtr.productName}
                      {mtr.productCode && (
                        <span className="ml-2 text-xs font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {mtr.productCode}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mtr.projectName}
                      {mtr.requisitionNo != null && ` (Requisition ${mtr.requisitionNo})`} • Make: {mtr.make || "N/A"} • UOM: {mtr.uom || "N/A"} • Qty: {mtr.purchaseMTR}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <span className="text-sm text-gray-600">{selectedCount} item(s) selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
