"use client"
import { useState, useEffect, useCallback } from "react"
import { projectService } from "../../services/projectService"

const formatDate = (dateString) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const typeMeta = (type) => {
  switch ((type || "").toUpperCase()) {
    case "BILLABLE":    return { label: "Billable",     cls: "bg-blue-100 text-blue-800" }
    case "TOOLS":       return { label: "Tool",         cls: "bg-purple-100 text-purple-800" }
    case "SKILLSET":    return { label: "Skill",        cls: "bg-red-100 text-red-800" }
    case "NONBILLABLE": return { label: "Non-billable", cls: "bg-amber-100 text-amber-800" }
    default:            return { label: "Item",         cls: "bg-gray-100 text-gray-700" }
  }
}

const numOrDash = (v) => (v === null || v === undefined || v === "" ? "—" : v)

export default function StoreMaterialRequisitions({ mode = "manager", assignedProjectIds = null }) {
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [projectQuery, setProjectQuery] = useState("")
  const [productQuery, setProductQuery] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [requiredOnDate, setRequiredOnDate] = useState("")
  const [remarkQuery, setRemarkQuery] = useState("")
  const [expanded, setExpanded] = useState({})
  const [editingStock, setEditingStock] = useState({})
  const [savingStock, setSavingStock] = useState({})

  const fetchRequisitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await projectService.getAllRequisitions()
      let approved = (Array.isArray(data) ? data : []).filter(
        (r) => (r.status || "").toUpperCase() === "APPROVED"
      )
      if (mode === "incharge" && Array.isArray(assignedProjectIds)) {
        approved = approved.filter((r) => assignedProjectIds.includes(r.projectId))
      }
      setRequisitions(approved)
    } catch (e) {
      setError("Failed to load requisitions. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequisitions() }, [fetchRequisitions])

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const hasLineFilter = !!productQuery || priorityFilter !== "All" || !!requiredOnDate || !!remarkQuery

  const lineMatches = (l) => {
    if (productQuery && !(l.productName || "").toLowerCase().includes(productQuery.toLowerCase())) return false
    if (priorityFilter !== "All" && (l.priority || "MEDIUM").toUpperCase() !== priorityFilter) return false
    if (requiredOnDate) {
      if (!l.expectedDeliveryDate) return false
      const a = new Date(l.expectedDeliveryDate).toDateString()
      const b = new Date(requiredOnDate).toDateString()
      if (a !== b) return false
    }
    if (remarkQuery && !(l.remarks || "").toLowerCase().includes(remarkQuery.toLowerCase())) return false
    return true
  }

  const filtered = requisitions
    .filter((r) => {
      if (projectQuery && !(r.projectName || "").toLowerCase().includes(projectQuery.toLowerCase())) return false
      if (fromDate && (!r.createdAt || new Date(r.createdAt) < new Date(fromDate))) return false
      if (toDate) {
        if (!r.createdAt) return false
        const end = new Date(toDate); end.setHours(23, 59, 59, 999)
        if (new Date(r.createdAt) > end) return false
      }
      return true
    })
    .map((r) => {
      const visibleLines = hasLineFilter ? (r.lines || []).filter(lineMatches) : (r.lines || [])
      return { ...r, visibleLines }
    })
    .filter((r) => !hasLineFilter || r.visibleLines.length > 0)
  

  const handleStockChange = (lineId, value) => {
    setEditingStock((prev) => ({ ...prev, [lineId]: value }))
  }

  const handleStockSave = async (req, line) => {
    const value = editingStock[line.id]
    if (value === undefined || value === "") return
    const stock = parseFloat(value)
    if (isNaN(stock) || stock < 0) { alert("Invalid stock quantity."); return }
    if (stock > line.mtrQty) { alert(`Stock cannot exceed MTR Qty (${line.mtrQty}).`); return }

    setSavingStock((prev) => ({ ...prev, [line.id]: true }))
    try {
      await projectService.updateStockAlloted(req.projectId, req.id, line.id, line.itemKind, stock)
      setRequisitions((prev) => prev.map((r) => {
        if (r.id !== req.id) return r
        return {
          ...r,
          lines: (r.lines || []).map((l) => {
            if (l.id !== line.id) return l
            const purchaseMTR = Math.max(0, (l.mtrQty || 0) - stock)
            return { ...l, stockAlloted: stock, purchaseMTR }
          })
        }
      }))
      setEditingStock((prev) => { const n = { ...prev }; delete n[line.id]; return n })
    } catch (e) {
      alert("Failed to save stock: " + (e?.response?.data?.message || e.message))
    } finally {
      setSavingStock((prev) => ({ ...prev, [line.id]: false }))
    }
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold leading-none tracking-tight text-blue-700">Material Requisitions</h2>
          <p className="text-sm text-gray-500">Showing approved requisitions — update stock allotted per line</p>
        </div>
        <div className="p-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-blue-800">Project name</label>
              <input type="text" value={projectQuery} onChange={(e) => setProjectQuery(e.target.value)} placeholder="Search project..."
                className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-blue-800">Product name</label>
              <input type="text" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search item..."
                className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-blue-800">From date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-blue-800">To date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-blue-800">Priority</label>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="All">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-blue-800">Required On Date</label>
              <input type="date" value={requiredOnDate} onChange={(e) => setRequiredOnDate(e.target.value)}
                className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-blue-800">Remark</label>
              <input type="text" value={remarkQuery} onChange={(e) => setRemarkQuery(e.target.value)} placeholder="Search remark..."
                className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-7 flex justify-end">
              <button onClick={() => { setProjectQuery(""); setProductQuery(""); setFromDate(""); setToDate(""); setPriorityFilter("All"); setRequiredOnDate(""); setRemarkQuery("") }}
                className="text-sm text-blue-700 hover:text-blue-900 underline">Clear filters</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading requisitions...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No approved requisitions found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => {
                const open = hasLineFilter ? true : !!expanded[req.id]
                const lines = req.visibleLines || req.lines || []
                return (
                  <div key={req.id} className="border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3">
                      <button onClick={() => toggle(req.id)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                        <span className="text-gray-500 w-4">{open ? "▾" : "▸"}</span>
                        <span className="font-semibold text-gray-800">
                          {req.projectName || "Project"} — Requisition {req.requisitionNo}
                        </span>
                        <span className="text-xs text-gray-400">({lines.length} item{lines.length !== 1 ? "s" : ""})</span>
                      </button>
                      <span className="text-xs text-gray-400 shrink-0 flex flex-col items-end gap-0.5">
                        <span>Created: {formatDate(req.createdAt)}</span>
                        {req.pmApprovalDate && <span className="text-green-600">Approved: {formatDate(req.pmApprovalDate)}</span>}
                      </span>
                    </div>
                    {open && (
                      <div className="border-t border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-gray-700 text-xs">
                            <tr>
                              <th className="text-left px-4 py-2 pl-10 font-semibold">Item</th>
                              <th className="text-right px-3 py-2 font-semibold">MTR Qty</th>
                              <th className="text-right px-3 py-2 font-semibold">Stock Allotted</th>
                              <th className="text-right px-3 py-2 font-semibold">Purchase Qty</th>
                              <th className="text-right px-3 py-2 pr-4 font-semibold">DC Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {lines.map((l, i) => {
                              const meta = typeMeta(l.type)
                              const isEditing = editingStock[l.id] !== undefined
                              const stockVal = isEditing ? editingStock[l.id] : (l.stockAlloted ?? "")
                              const purchaseVal = isEditing
                                ? Math.max(0, (l.mtrQty || 0) - parseFloat(editingStock[l.id] || 0))
                                : (l.purchaseMTR ?? "")
                              return (
                                <tr key={l.id ?? i} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 pl-10">
                                    <span className="flex items-center gap-2">
                                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                                      <span className="text-gray-700">{l.productName}</span>
                                    </span>
                                    <div className="flex items-center gap-3 mt-1 pl-1">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${l.priority === "HIGH" ? "bg-red-100 text-red-700" : l.priority === "LOW" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                        {l.priority || "MEDIUM"}
                                      </span>
                                      {l.expectedDeliveryDate && <span className="text-[10px] text-gray-500">📅 {new Date(l.expectedDeliveryDate).toLocaleDateString()}</span>}
                                      {l.remarks && <span className="text-[10px] text-gray-500 italic">"{l.remarks}"</span>}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium text-gray-800">{numOrDash(l.mtrQty)}</td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <input
                                        type="number" min="0" max={l.mtrQty}
                                        value={stockVal}
                                        onChange={(e) => handleStockChange(l.id, e.target.value)}
                                        className="w-20 h-8 rounded border border-blue-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      {isEditing && (
                                        <button onClick={() => handleStockSave(req, l)}
                                          disabled={savingStock[l.id]}
                                          className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                                          {savingStock[l.id] ? "..." : "Save"}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-600">{numOrDash(purchaseVal)}</td>
                                  <td className="px-3 py-2 text-right text-gray-600 pr-4">
                                    <span className={(l.mtrQty || 0) - (l.dcQty || 0) > 0 ? "text-red-600 font-semibold" : ""}>
                                      {numOrDash(l.dcQty)}
                                    </span>
                                    {(l.mtrQty || 0) - (l.dcQty || 0) > 0 && (
                                      <div className="text-[10px] text-red-500 mt-0.5">
                                        Pending: {((l.mtrQty || 0) - (l.dcQty || 0)).toFixed(2)}
                                      </div>
                                    )}
                                    {l.dcBreakdown && l.dcBreakdown.length > 0 && (
                                      <div className="flex flex-col items-end gap-0.5 mt-1">
                                        {l.dcBreakdown.map((dc, di) => (
                                          <span key={di} className="text-[10px] text-gray-400">
                                            {dc.dcNumber}: {dc.dcQty}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
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
      </div>
    </div>
  )
}