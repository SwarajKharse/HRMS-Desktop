"use client"

import { useState, useEffect, useCallback } from "react"
import { FiX, FiSearch } from "react-icons/fi"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { getErrorMessage } from "../../../utils/errorUtils"

// "Add Item" picker for a Labour Work Order — lists the project's BOQ items
// (billable + non-billable + tools; skillSet excluded by the backend), each with
// the quantity still available. A pick can be 1..remainingQty; the remainder is
// left for the next labour work order.
export default function AddBoqItemsModal({ projectId, excludeRefKeys = [], onClose, onAdd }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState({}) // refKey -> { item, qty }

  const refKey = (it) => `${it.refType}:${it.refId}`

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await comparisonSheetService.getLabourBoqItems(projectId)
      setItems(
        (data || []).filter(
          (it) => (it.remainingQty ?? 0) > 0 && !excludeRefKeys.includes(`${it.refType}:${it.refId}`),
        ),
      )
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load project BOQ items."))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const toggle = (it) => {
    setSelected((prev) => {
      const k = refKey(it)
      const next = { ...prev }
      if (next[k]) delete next[k]
      else next[k] = { item: it, qty: String(it.remainingQty ?? "") }
      return next
    })
  }

  const setQty = (k, qty) => setSelected((prev) => (prev[k] ? { ...prev, [k]: { ...prev[k], qty } } : prev))

  const qtyError = (sel) => {
    const n = Number.parseFloat(sel.qty)
    const rem = sel.item.remainingQty ?? 0
    if (Number.isNaN(n) || n <= 0) return "Qty must be greater than 0"
    if (n - rem > 1e-6) return `Max ${rem}`
    return null
  }

  const handleAdd = () => {
    const rows = Object.values(selected)
    const bad = rows.find((s) => qtyError(s))
    if (bad) {
      setError(`"${bad.item.itemName}": ${qtyError(bad)}`)
      return
    }
    onAdd(rows.map(({ item, qty }) => ({ ...item, qty: Number.parseFloat(qty) })))
    onClose()
  }

  const visible = items.filter((it) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (it.itemName || "").toLowerCase().includes(q) ||
      (it.productCode || "").toLowerCase().includes(q) ||
      (it.categoryType || "").toLowerCase().includes(q)
    )
  })

  const selectedCount = Object.keys(selected).length

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h3 className="text-lg font-bold text-blue-700">Add BOQ Items to Labour Work Order</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">{error}</div>
        )}

        <div className="p-4 border-b">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item, code or category..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading BOQ items...</div>
          ) : visible.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No BOQ quantity left — every item is fully allocated to labour work orders.
            </div>
          ) : (
            <div className="space-y-1">
              {visible.map((it) => {
                const k = refKey(it)
                const sel = selected[k]
                const err = sel ? qtyError(sel) : null
                return (
                  <div key={k} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 border-b border-gray-100">
                    <input type="checkbox" checked={!!sel} onChange={() => toggle(it)} className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {it.itemName}
                        {it.productCode && (
                          <span className="ml-2 text-xs font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {it.productCode}
                          </span>
                        )}
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {it.refType === "CATEGORY" ? it.categoryType || "CATEGORY" : "BILLABLE"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Make: {it.make || "N/A"} • UOM: {it.uom || "N/A"} • BOQ: {it.boqQty ?? "N/A"} • Remaining:{" "}
                        <span className="font-medium text-gray-700">{it.remainingQty}</span>
                      </div>
                    </div>
                    {sel && (
                      <div className="flex flex-col items-end">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          max={it.remainingQty}
                          value={sel.qty}
                          onChange={(e) => setQty(k, e.target.value)}
                          placeholder="Qty"
                          className={`w-24 px-2 py-1 border rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            err ? "border-red-400 bg-red-50" : "border-blue-300"
                          }`}
                        />
                        {err && <span className="text-[10px] text-red-600 mt-0.5">{err}</span>}
                      </div>
                    )}
                  </div>
                )
              })}
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
