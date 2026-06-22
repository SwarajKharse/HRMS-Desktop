"use client"
import { useState, useEffect, useCallback } from "react"
import { projectService } from "../../services/projectService"
import { useAuth } from "../../contexts/AuthContext"

const typeMeta = (type) => {
  switch ((type || "").toUpperCase()) {
    case "BILLABLE":    return { label: "Billable",     cls: "bg-blue-100 text-blue-800" }
    case "TOOLS":       return { label: "Tool",         cls: "bg-purple-100 text-purple-800" }
    case "SKILLSET":    return { label: "Skill",        cls: "bg-red-100 text-red-800" }
    case "NONBILLABLE": return { label: "Non-billable", cls: "bg-amber-100 text-amber-800" }
    default:            return { label: "Item",         cls: "bg-gray-100 text-gray-700" }
  }
}
const fmtDateTime = (s) => { if (!s) return ""; try { return new Date(s).toLocaleString() } catch { return "" } }
const lineKey = (l) => `${l.itemKind}-${l.lineId}`

export default function DeliveryChallan() {
  const { user } = useAuth()
  const currentUserId = user?.userId

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [dcableLines, setDcableLines] = useState([])
  const [pastDCs, setPastDCs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedLines, setSelectedLines] = useState({})
  const [dcNumber, setDcNumber] = useState("")
  const [dcFile, setDcFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedDC, setExpandedDC] = useState({})

  useEffect(() => {
    projectService.getAllRequisitions().then((data) => {
      const list = Array.isArray(data) ? data : []
      const map = new Map()
      list.forEach((r) => {
        if (r.projectId && !map.has(r.projectId)) {
          map.set(r.projectId, { id: r.projectId, project_name: r.projectName })
        }
      })
      setProjects(Array.from(map.values()))
    }).catch(() => {})
  }, [])

  const loadProjectData = useCallback(async (projectId) => {
    if (!projectId) return
    setLoading(true)
    setError("")
    setSelectedLines({})
    try {
      const [lines, dcs] = await Promise.all([
        projectService.getDCableLines(projectId),
        projectService.getDeliveryChallans(projectId),
      ])
      setDcableLines(Array.isArray(lines) ? lines : [])
      setPastDCs(Array.isArray(dcs) ? dcs : [])
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load DC data for this project.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) loadProjectData(selectedProjectId)
  }, [selectedProjectId, loadProjectData])

  const toggleLine = (line) => {
    const key = lineKey(line)
    setSelectedLines((prev) => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
      } else {
        next[key] = { line, dcQty: "" }
      }
      return next
    })
  }

  const updateDcQty = (key, value) => {
    setSelectedLines((prev) => {
      if (!prev[key]) return prev
      let v = value
      const n = parseFloat(value)
      if (!isNaN(n) && n > prev[key].line.remainingDcQty) v = String(prev[key].line.remainingDcQty)
      if (!isNaN(n) && n < 0) v = "0"
      return { ...prev, [key]: { ...prev[key], dcQty: v } }
    })
  }

  const selectedCount = Object.keys(selectedLines).length
  const allValid = selectedCount > 0 && Object.values(selectedLines).every((s) => {
    const n = parseFloat(s.dcQty)
    return !isNaN(n) && n > 0 && n <= s.line.remainingDcQty
  })

  const handleCreateDC = async () => {
    if (!dcNumber.trim()) { setError("Please enter a DC number."); return }
    if (!dcFile) { setError("Please upload a DC file."); return }
    if (!allValid) { setError("Please enter valid DC quantities for all selected items."); return }
    setSaving(true)
    setError("")
    try {
      const lines = Object.values(selectedLines).map((s) => ({
        lineId: s.line.lineId,
        itemKind: s.line.itemKind,
        dcQty: parseFloat(s.dcQty),
      }))
      await projectService.createDeliveryChallan(selectedProjectId, dcNumber.trim(), currentUserId, lines, dcFile)
      setDcNumber("")
      setDcFile(null)
      setSelectedLines({})
      await loadProjectData(selectedProjectId)
      alert("Delivery challan created successfully!")
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create delivery challan.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold leading-none tracking-tight text-blue-700">Delivery Challan</h2>
          <p className="text-sm text-gray-500">Select items across requisitions and issue one delivery challan</p>
        </div>

        <div className="p-6 pt-4 space-y-6">
          <div className="flex flex-col gap-1 max-w-md">
            <label className="text-xs font-medium text-blue-800">Select Project</label>
            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">{error}</div>}

          {selectedProjectId && (
            loading ? <div className="text-sm text-gray-500">Loading...</div> : (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Items</h3>
                  {dcableLines.length === 0 ? (
                    <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-6 text-center">
                      No items pending DC for this project.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-md divide-y max-h-80 overflow-y-auto">
                      {dcableLines.map((l) => {
                        const key = lineKey(l)
                        const checked = !!selectedLines[key]
                        return (
                          <div key={key} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
                            <label className="flex items-center gap-2 flex-1 min-w-0">
                              <input type="checkbox" checked={checked} onChange={() => toggleLine(l)} className="h-4 w-4" />
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeMeta(l.type).cls}`}>{typeMeta(l.type).label}</span>
                              <span className="truncate">{l.productName}</span>
                              <span className="text-xs text-gray-400">(Req {l.requisitionNo})</span>
                            </label>
                            <span className="flex items-center gap-3 shrink-0">
                              <span className="text-gray-500 text-xs">Remaining: {l.remainingDcQty}</span>
                              {checked && (
                                <input type="number" min="0" max={l.remainingDcQty} placeholder="Qty"
                                  value={selectedLines[key].dcQty}
                                  onChange={(e) => updateDcQty(key, e.target.value)}
                                  className="w-20 h-8 rounded border border-blue-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {selectedCount > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-blue-800">DC Number <span className="text-red-500">*</span></label>
                        <input type="text" value={dcNumber} onChange={(e) => setDcNumber(e.target.value)} placeholder="e.g. DC-001"
                          className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-blue-800">DC File <span className="text-red-500">*</span></label>
                        <input type="file" onChange={(e) => setDcFile(e.target.files?.[0] || null)}
                          className="h-10 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handleCreateDC} disabled={saving || !allValid}
                        className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? "Creating..." : `Create DC (${selectedCount} item${selectedCount !== 1 ? "s" : ""})`}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Past Delivery Challans</h3>
                  {pastDCs.length === 0 ? (
                    <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-6 text-center">
                      No delivery challans created yet for this project.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pastDCs.map((dc) => {
                        const open = !!expandedDC[dc.id]
                        return (
                          <div key={dc.id} className="border border-gray-200 rounded-md">
                            <div className="flex items-center justify-between px-4 py-2">
                              <button onClick={() => setExpandedDC((p) => ({ ...p, [dc.id]: !p[dc.id] }))}
                                className="flex items-center gap-2 text-left flex-1 min-w-0">
                                <span className="text-gray-500 w-4">{open ? "▾" : "▸"}</span>
                                <span className="font-semibold text-gray-800">{dc.dcNumber}</span>
                                <span className="text-xs text-gray-400">({(dc.lines || []).length} item{(dc.lines || []).length !== 1 ? "s" : ""})</span>
                              </button>
                              <span className="flex items-center gap-3 shrink-0">
                                {dc.dcFilePath && (
                                  <a href={dc.dcFilePath} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline">
                                    {dc.dcFileName || "View file"}
                                  </a>
                                )}
                                <span className="text-xs text-gray-400">{fmtDateTime(dc.createdAt)}</span>
                              </span>
                            </div>
                            {open && (
                              <div className="border-t px-4 py-2 text-sm space-y-1">
                                {(dc.lines || []).map((l, i) => (
                                  <div key={i} className="flex items-center justify-between text-gray-600">
                                    <span>{l.productName} <span className="text-xs text-gray-400">(Req {l.requisitionNo})</span></span>
                                    <span className="font-medium">{l.dcQty}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}