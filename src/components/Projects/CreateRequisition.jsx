import { useState, useEffect, useMemo } from "react"
import { projectService } from "../../services/projectService"

const TYPE_BADGE = {
  BILLABLE: "bg-blue-100 text-blue-800",
  NONBILLABLE: "bg-amber-100 text-amber-800",
  TOOLS: "bg-purple-100 text-purple-800",
  SKILLSET: "bg-red-100 text-red-800",
}
const typeLabel = (t) => {
  switch (t) {
    case "BILLABLE": return "Billable"
    case "NONBILLABLE": return "Non-billable"
    case "TOOLS": return "Tool"
    case "SKILLSET": return "Skill"
    default: return t || "Item"
  }
}
const statusBadge = (s) => {
  switch ((s || "").toUpperCase()) {
    case "APPROVED": return "bg-green-100 text-green-800"
    case "REJECTED": return "bg-red-100 text-red-800"
    case "PENDING": return "bg-yellow-100 text-yellow-800"
    default: return "bg-gray-100 text-gray-700"
  }
}
const fmtDate = (s) => { if (!s) return ""; try { return new Date(s).toLocaleDateString() } catch { return "" } }
const fmtDateTime = (s) => { if (!s) return ""; try { return new Date(s).toLocaleString() } catch { return "" } }
const numOrDash = (v) => (v === null || v === undefined || v === "" ? "—" : v)
const lineKey = (it) => `${it.itemKind}-${it.refId}`

export default function CreateRequisition({ projectId, createdBy = null, isOpen, onClose, onSaved, initialEditReq = null }) {
  const [items, setItems] = useState([])
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [lines, setLines] = useState([])
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState("history")
  const [expanded, setExpanded] = useState({})
  const [expandedReq, setExpandedReq] = useState({})
  const [editingReqId, setEditingReqId] = useState(null)
  const [versionIdx, setVersionIdx] = useState({})
  const [requiredOnSiteDate, setRequiredOnSiteDate] = useState("")
  const [remark, setRemark] = useState("")
  const [priority, setPriority] = useState("MEDIUM")

  const loadAll = () =>
    Promise.all([
      projectService.getRequisitionableItems(projectId).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {}),
      projectService.getRequisitions(projectId).then((d) => setRequisitions(Array.isArray(d) ? d : [])).catch((e) => setError(e?.response?.data?.message || "Failed to load requisitions.")),
    ])

  useEffect(() => {
    if (!isOpen || !projectId) return
    setError(""); setLines([]); setSearch(""); setStep("history"); setExpanded({}); setExpandedReq({}); setEditingReqId(null); setRequiredOnSiteDate(""); setRemark(""); setPriority("MEDIUM"); setLoading(true)
    loadAll().finally(() => {
      setLoading(false)
      if (initialEditReq) startEdit(initialEditReq)
    })
  }, [isOpen, projectId])

  const addedKeys = useMemo(() => new Set(lines.map(lineKey)), [lines])

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const map = new Map()
    for (const it of items) {
      const key = it.boqItemId != null ? `b-${it.boqItemId}` : `s-${lineKey(it)}`
      if (!map.has(key)) map.set(key, { key, title: it.mainProductName || it.name || "—", items: [] })
      map.get(key).items.push(it)
    }
    let result = Array.from(map.values())
    if (term) {
      result = result
        .map((g) => ({ ...g, items: g.items.filter((it) => (it.name || "").toLowerCase().includes(term)) }))
        .filter((g) => g.items.length > 0 || (g.title || "").toLowerCase().includes(term))
    }
    return result
  }, [items, search])

  if (!isOpen) return null

  const addLine = (it) => { if (!addedKeys.has(lineKey(it))) setLines((p) => [...p, { ...it, qty: "", priority: "MEDIUM", remark: "", requiredOnSiteDate: "" }]) }
  const removeLine = (key) => setLines((p) => p.filter((l) => lineKey(l) !== key))
  const updateQty = (key, value) =>
    setLines((p) =>
      p.map((l) => {
        if (lineKey(l) !== key) return l
        let v = value
        const n = parseFloat(value)
        if (!isNaN(n) && n > l.pending) v = String(l.pending)
        if (!isNaN(n) && n < 0) v = "0"
        return { ...l, qty: v }
      })
    )
  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }))
  const updateLineField = (key, field, value) =>
    setLines((p) => p.map((l) => lineKey(l) === key ? { ...l, [field]: value } : l))
  const setVer = (reqId, idx) => setVersionIdx((p) => ({ ...p, [reqId]: idx }))

  const linesValid =
    lines.length > 0 &&
    lines.every((l) => { const n = parseFloat(l.qty); return !isNaN(n) && n > 0 && n <= l.pending })

  const startNew = () => { setEditingReqId(null); setLines([]); setSearch(""); setExpanded({}); setError(""); setStep("build") }

  const backToList = () => { setStep("history"); setEditingReqId(null); setLines([]); setError(""); setRequiredOnSiteDate(""); setRemark(""); setPriority("MEDIUM") }

  const startEdit = async (req) => {
    setError(""); setEditingReqId(req.id); setSearch(""); setExpanded({})
    setRequiredOnSiteDate(req.requiredOnSiteDate || "")
    setRemark(req.remark || "")
    setPriority(req.priority || "MEDIUM")
    try {
      const data = await projectService.getRequisitionableItems(projectId, req.id)
      const its = Array.isArray(data) ? data : []
      setItems(its)
      const prefilled = (req.lines || []).map((l) => {
        const match = its.find((it) => it.itemKind === l.itemKind && String(it.refId) === String(l.refId))
        return {
          itemKind: l.itemKind,
          refId: l.refId,
          type: l.type,
          name: l.productName,
          pending: match ? match.pending : (l.mtrQty || 0),
          qty: l.mtrQty != null ? String(l.mtrQty) : "",
          priority: l.priority || "MEDIUM",
          remark: l.remarks || "",
          requiredOnSiteDate: l.expectedDeliveryDate || "",
        }
      })
      setLines(prefilled)
      setStep("build")
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to open requisition for editing.")
      setEditingReqId(null)
    }
  }

  const handleSave = async () => {
    setError(""); setSaving(true)
    try {
      const payload = { createdBy, lines: lines.map((l) => ({ itemKind: l.itemKind, refId: l.refId, qty: parseFloat(l.qty), priority: l.priority || "MEDIUM", remarks: l.remark || "", expectedDeliveryDate: l.requiredOnSiteDate || null })) }
      const result = editingReqId
        ? await projectService.updateRequisition(projectId, editingReqId, payload)
        : await projectService.createRequisition(projectId, payload)
      if (onSaved) onSaved(result)
      await loadAll()
      setLines([]); setEditingReqId(null); setStep("history")
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save requisition.")
      setStep("build")
    } finally {
      setSaving(false)
    }
  }

  const subItemRow = (it) => {
    const added = addedKeys.has(lineKey(it))
    return (
      <div key={lineKey(it)} className="flex items-center justify-between px-3 py-2 text-sm">
        <span className="flex items-center gap-2">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[it.type] || "bg-gray-100 text-gray-700"}`}>{typeLabel(it.type)}</span>
          <span>{it.name}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{it.pending > 0 ? `${it.pending} pending` : "none left"}</span>
          <button onClick={() => addLine(it)} disabled={it.pending <= 0 || added}
            className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">{added ? "Added" : "Add"}</button>
        </span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-lg font-semibold text-blue-900">
            {step === "history" ? "Requisitions" : step === "build" ? (editingReqId ? "Edit Requisition" : "New Requisition") : "Review Requisition"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">{error}</div>}

          {step === "history" && (
            loading ? <div className="text-sm text-gray-500">Loading...</div> : (
              requisitions.length === 0 ? (
                <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-8 text-center">
                  No requisitions yet. Click "New Requisition" to create the first one.
                </div>
              ) : (
                <div className="space-y-3">
                  {requisitions.map((req) => {
                    const open = !!expandedReq[req.id]
                    const count = (req.lines || []).length
                    const versions = req.versions || []
                    const hasVersions = versions.length > 0
                    const lastIdx = versions.length - 1
                    const idx = hasVersions ? (versionIdx[req.id] != null ? Math.min(versionIdx[req.id], lastIdx) : lastIdx) : 0
                    const onLatest = !hasVersions || idx === lastIdx
                    const shownLines = onLatest ? (req.lines || []) : (versions[idx].lines || [])
                    const stamp = hasVersions ? versions[idx].editedAt : req.createdAt
                    const prevLines = (hasVersions && idx > 0) ? (versions[idx - 1].lines || []) : null
                    return (
                      <div key={req.id} className="border border-gray-200 rounded-md">
                        <div className="w-full flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-0">
                            <button onClick={() => setExpandedReq((p) => ({ ...p, [req.id]: !p[req.id] }))} className="flex items-center gap-2 text-left min-w-0 md:flex-1">
                              <span className="text-gray-500 w-4 shrink-0">{open ? "▾" : "▸"}</span>
                              <span className="font-semibold text-gray-800 truncate">Requisition {req.requisitionNo}</span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusBadge(req.status)}`}>{req.status}</span>
                              <span className="text-xs text-gray-400 shrink-0">({count} item{count !== 1 ? "s" : ""})</span>
                            </button>
                            <div className="flex items-center gap-3 pl-6 md:pl-0 md:shrink-0">
                              {req.status !== "APPROVED" && (
                                <button onClick={() => startEdit(req)} className="px-3 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50">Edit</button>
                              )}
                              <span className="text-xs text-gray-400">{fmtDate(req.createdAt)}</span>
                            </div>
                          </div>
                        

                        {open && (
                          <div className="border-t">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 text-xs">
                              <span className="text-gray-500">
                                {hasVersions && versions.length > 1
                                  ? (onLatest ? `Latest (v${versions[idx].versionNo} of ${versions.length})` : `Version ${versions[idx].versionNo} of ${versions.length}`)
                                  : "Current"}
                              </span>
                              <span className="flex items-center gap-2">
                                {hasVersions && versions.length > 1 && (
                                  <button onClick={() => setVer(req.id, idx - 1)} disabled={idx === 0}
                                    className="px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Older">◀</button>
                                )}
                                <span className="text-gray-600">{fmtDateTime(stamp)}</span>
                                {hasVersions && versions.length > 1 && (
                                  <button onClick={() => setVer(req.id, idx + 1)} disabled={idx === lastIdx}
                                    className="px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Newer">▶</button>
                                )}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs">
                                  <tr>
                                    <th className="text-left px-4 py-2 pl-10">Item</th>
                                    <th className="text-right px-3 py-2">Req Qty</th>
                                    <th className="text-right px-3 py-2">Stock Allotted</th>
                                    <th className="text-right px-3 py-2">Purchase Qty</th>
                                    <th className="text-right px-3 py-2 pr-4">DC Qty</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {shownLines.map((l, i) => {
                                    const prev = prevLines ? prevLines.find((p) => p.itemKind === l.itemKind && String(p.refId) === String(l.refId)) : null
                                    const isNew = !!prevLines && !prev
                                    const changed = !!prevLines && !!prev && Number(prev.mtrQty) !== Number(l.mtrQty)
                                    return (
                                      <tr key={l.id != null ? l.id : i} className={isNew ? "bg-green-50" : changed ? "bg-amber-50" : ""}>
                                        <td className="px-4 py-2 pl-10">
                                          <span className="flex items-center gap-2">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[l.type] || "bg-gray-100 text-gray-700"}`}>{typeLabel(l.type)}</span>
                                            <span>{l.productName}</span>
                                            {isNew && <span className="text-[10px] uppercase tracking-wide text-green-700 bg-green-100 px-1.5 py-0.5 rounded">new</span>}
                                          </span>
                                          <div className="flex items-center gap-3 mt-1 pl-1">
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${l.priority === "HIGH" ? "bg-red-100 text-red-700" : l.priority === "LOW" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                              {l.priority || "MEDIUM"}
                                            </span>
                                            {l.expectedDeliveryDate && <span className="text-[10px] text-gray-500">📅 {fmtDate(l.expectedDeliveryDate)}</span>}
                                            {l.remarks && <span className="text-[10px] text-gray-500 italic">"{l.remarks}"</span>}
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-800">
                                          {numOrDash(l.mtrQty)}
                                          {changed && <span className="ml-1 text-xs text-amber-700">(was {numOrDash(prev.mtrQty)})</span>}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-600">{numOrDash(l.stockAlloted)}</td>
                                        <td className="px-3 py-2 text-right text-gray-600">{numOrDash(l.purchaseMTR)}</td>
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
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            ))}

          {step === "build" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-blue-800">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="h-9 rounded-md border border-blue-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-blue-800">Required on Site Date</label>
                  <input type="date" value={requiredOnSiteDate} onChange={(e) => setRequiredOnSiteDate(e.target.value)}
                    className="h-9 rounded-md border border-blue-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-blue-800">Remark</label>
                  <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional remark..."
                    className="h-9 rounded-md border border-blue-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Add items</label>
                <input type="text" placeholder="Search items by name..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-md border border-blue-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {loading ? <div className="text-sm text-gray-500 mt-2">Loading items...</div> : (
                  <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md divide-y">
                    {groups.length === 0 ? <div className="text-sm text-gray-400 px-3 py-2">No matching items.</div> : (
                      groups.map((g) => {
                        const billable = g.items.find((it) => it.type === "BILLABLE")
                        const subs = g.items.filter((it) => it.type !== "BILLABLE")
                        const open = !!expanded[g.key] || !!search.trim()
                        const billAdded = billable && addedKeys.has(lineKey(billable))
                        return (
                          <div key={g.key}>
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                              <button onClick={() => toggle(g.key)} className="flex items-center gap-2 text-left text-sm font-medium text-gray-800">
                                {subs.length > 0 ? <span className="w-4 text-gray-500">{open ? "▾" : "▸"}</span> : <span className="w-4" />}
                                <span>{g.title}</span>
                                {subs.length > 0 && <span className="text-xs text-gray-400">({subs.length} sub-item{subs.length > 1 ? "s" : ""})</span>}
                              </button>
                              {billable && (
                                <span className="flex items-center gap-3">
                                  <span className="text-gray-500 text-xs">{billable.pending > 0 ? `${billable.pending} pending` : "none left"}</span>
                                  <button onClick={() => addLine(billable)} disabled={billable.pending <= 0 || billAdded}
                                    className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">{billAdded ? "Added" : "Add"}</button>
                                </span>
                              )}
                            </div>
                            {open && subs.length > 0 && <div className="pl-6 divide-y bg-white">{subs.map((it) => subItemRow(it))}</div>}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-blue-800 mb-1">Selected items</div>
                {lines.length === 0 ? (
                  <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-6 text-center">Add items above to build this requisition.</div>
                ) : (
                  <>
                    {/* Desktop table (unchanged) */}
                    <div className="hidden md:block">
                      <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
                        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Item</th><th className="text-left px-3 py-2">Type</th><th className="text-right px-3 py-2">Pending</th><th className="text-right px-3 py-2">Qty</th><th className="text-left px-3 py-2">Priority</th><th className="text-left px-3 py-2">Required On Site</th><th className="text-left px-3 py-2">Remark</th><th className="px-3 py-2"></th></tr></thead>
                        <tbody className="divide-y">
                          {lines.map((l) => {
                            const k = lineKey(l)
                            return (
                              <tr key={k}>
                                <td className="px-3 py-2">{l.name}</td>
                                <td className="px-3 py-2"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[l.type] || "bg-gray-100 text-gray-700"}`}>{typeLabel(l.type)}</span></td>
                                <td className="px-3 py-2 text-right text-gray-500">{l.pending}</td>
                                <td className="px-3 py-2 text-right"><input type="number" min="0" max={l.pending} value={l.qty} onChange={(e) => updateQty(k, e.target.value)} className="w-24 h-9 rounded-md border border-blue-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></td>
                                <td className="px-3 py-2"><select value={l.priority || "MEDIUM"} onChange={(e) => updateLineField(k, "priority", e.target.value)} className="h-9 rounded-md border border-blue-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></td>
                                <td className="px-3 py-2"><input type="date" value={l.requiredOnSiteDate || ""} onChange={(e) => updateLineField(k, "requiredOnSiteDate", e.target.value)} className="h-9 rounded-md border border-blue-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></td>
                                <td className="px-3 py-2"><input type="text" value={l.remark || ""} onChange={(e) => updateLineField(k, "remark", e.target.value)} placeholder="Remark..." className="w-32 h-9 rounded-md border border-blue-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></td>
                                <td className="px-3 py-2 text-center"><button onClick={() => removeLine(k)} className="text-red-500 hover:text-red-700" title="Remove">×</button></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                      {lines.map((l) => {
                        const k = lineKey(l)
                        return (
                          <div key={k} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 break-words">{l.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[l.type] || "bg-gray-100 text-gray-700"}`}>{typeLabel(l.type)}</span>
                                  <span className="text-xs text-gray-500">{l.pending} pending</span>
                                </div>
                              </div>
                              <button onClick={() => removeLine(k)} className="text-red-500 hover:text-red-700 text-2xl leading-none shrink-0 px-1" title="Remove">×</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-gray-600">Qty</span>
                                <input type="number" min="0" max={l.pending} value={l.qty} onChange={(e) => updateQty(k, e.target.value)}
                                  className="h-10 rounded-md border border-blue-300 px-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </label>
                              <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-gray-600">Priority</span>
                                <select value={l.priority || "MEDIUM"} onChange={(e) => updateLineField(k, "priority", e.target.value)}
                                  className="h-10 rounded-md border border-blue-300 px-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                                </select>
                              </label>
                              <label className="flex flex-col gap-1 col-span-2">
                                <span className="text-xs font-medium text-gray-600">Required on Site</span>
                                <input type="date" value={l.requiredOnSiteDate || ""} onChange={(e) => updateLineField(k, "requiredOnSiteDate", e.target.value)}
                                  className="h-10 rounded-md border border-blue-300 px-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </label>
                              <label className="flex flex-col gap-1 col-span-2">
                                <span className="text-xs font-medium text-gray-600">Remark</span>
                                <input type="text" value={l.remark || ""} onChange={(e) => updateLineField(k, "remark", e.target.value)} placeholder="Optional..."
                                  className="h-10 rounded-md border border-blue-300 px-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {step === "review" && (
            <div>
              <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded px-3 py-2 mb-3">
                {editingReqId ? "Review the updated items. Saving puts this requisition back to pending for PM approval." : "Review the items below. Saving creates a new requisition, pending PM approval."}
              </div>
              <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Item</th><th className="text-left px-3 py-2">Type</th><th className="text-right px-3 py-2">Qty</th></tr></thead>
                <tbody className="divide-y">
                  {lines.map((l) => (
                    <tr key={lineKey(l)}>
                      <td className="px-3 py-2">{l.name}</td>
                      <td className="px-3 py-2"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[l.type] || "bg-gray-100 text-gray-700"}`}>{typeLabel(l.type)}</span></td>
                      <td className="px-3 py-2 text-right font-medium">{l.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          {step === "history" && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
              <button onClick={startNew} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">+ New Requisition</button>
            </>
          )}
          {step === "build" && (
            <>
              <button onClick={backToList} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">← Back to list</button>
              <button onClick={() => setStep("review")} disabled={!linesValid} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Review →</button>
            </>
          )}
          {step === "review" && (
            <>
              <button onClick={() => setStep("build")} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">← Back</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "Saving..." : (editingReqId ? "Confirm & Update" : "Confirm & Save")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}