"use client"
import { useState, useEffect, useCallback, useRef, Fragment } from "react"
import { FiUpload, FiEdit2, FiLoader, FiCheck } from "react-icons/fi"
import { projectService } from "../../services/projectService"
import { useAuth } from "../../contexts/AuthContext"

const ALLOWED_DC_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
const MAX_DC_FILE_SIZE = 5 * 1024 * 1024 // 5MB

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
  const [uploadingDcId, setUploadingDcId] = useState(null)
  const [savedDcId, setSavedDcId] = useState(null)
  const dcCopyInputRefs = useRef({})

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

  const handleDcCopyFileSelect = async (dc, file) => {
    if (!file) return
    if (!ALLOWED_DC_FILE_TYPES.includes(file.type)) {
      alert("Only PDF, JPG or PNG files are allowed.")
      return
    }
    if (file.size > MAX_DC_FILE_SIZE) {
      alert("File must be 5MB or smaller.")
      return
    }
    setUploadingDcId(dc.id)
    try {
      await projectService.uploadDeliveryChallanCopy(dc.id, file)
      await loadProjectData(selectedProjectId)
      setSavedDcId(dc.id)
      setTimeout(() => setSavedDcId((id) => (id === dc.id ? null : id)), 2000)
    } catch (e) {
      alert("Failed to upload DC copy: " + (e?.response?.data?.message || e.message))
    } finally {
      setUploadingDcId(null)
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
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-700 text-xs">
                          <tr>
                            <th className="text-left px-4 py-2 font-semibold">DC No</th>
                            <th className="text-left px-4 py-2 font-semibold">DC Copy</th>
                            <th className="text-left px-4 py-2 font-semibold">Signed Back Copy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pastDCs.map((dc) => {
                            const open = !!expandedDC[dc.id]
                            return (
                              <Fragment key={dc.id}>
                                <tr className="align-top">
                                  <td className="px-4 py-2 min-w-0">
                                    <button onClick={() => setExpandedDC((p) => ({ ...p, [dc.id]: !p[dc.id] }))}
                                      className="flex items-center gap-2 text-left">
                                      <span className="text-gray-500 w-4 shrink-0">{open ? "▾" : "▸"}</span>
                                      <span className="font-semibold text-gray-800 truncate">{dc.dcNumber}</span>
                                      <span className="text-xs text-gray-400 shrink-0">({(dc.lines || []).length} item{(dc.lines || []).length !== 1 ? "s" : ""})</span>
                                    </button>
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      className="hidden"
                                      ref={(el) => { dcCopyInputRefs.current[dc.id] = el }}
                                      onChange={(e) => { handleDcCopyFileSelect(dc, e.target.files?.[0]); e.target.value = "" }}
                                    />
                                    {(() => {
                                      const isUploading = uploadingDcId === dc.id
                                      const justSaved = savedDcId === dc.id
                                      return dc.dcFilePath ? (
                                        <div className="flex items-start gap-1.5">
                                          <div className="flex flex-col gap-0.5 min-w-0">
                                            <a href={dc.dcFilePath} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline break-all">
                                              {dc.dcFileName || "View file"}
                                            </a>
                                            <span className="text-[10px] text-gray-400">{fmtDateTime(dc.createdAt)}</span>
                                          </div>
                                          {isUploading ? (
                                            <FiLoader size={12} className="text-gray-400 shrink-0 mt-0.5 animate-spin" />
                                          ) : justSaved ? (
                                            <FiCheck size={14} className="text-green-600 shrink-0 mt-0.5" title="Saved" />
                                          ) : (
                                            <button
                                              onClick={() => dcCopyInputRefs.current[dc.id]?.click()}
                                              className="text-gray-400 hover:text-blue-600 shrink-0"
                                              title="Replace DC copy"
                                            >
                                              <FiEdit2 size={12} />
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => dcCopyInputRefs.current[dc.id]?.click()}
                                          disabled={isUploading}
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                                          title="Upload DC copy"
                                        >
                                          {isUploading ? <FiLoader size={12} className="animate-spin" /> : <FiUpload size={12} />}
                                          {isUploading ? "Uploading..." : "Upload DC copy"}
                                        </button>
                                      )
                                    })()}
                                  </td>
                                  <td className="px-4 py-2">
                                    {dc.signedDcFilePath ? (
                                      <div className="flex flex-col gap-0.5">
                                        <a href={dc.signedDcFilePath} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:text-green-900 underline break-all">
                                          {dc.signedDcFileName || "Signed copy"}
                                        </a>
                                        <span className="text-[10px] text-gray-400">{fmtDateTime(dc.signedDcUploadedAt)}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">Not uploaded yet</span>
                                    )}
                                  </td>
                                </tr>
                                {open && (
                                  <tr>
                                    <td colSpan={3} className="border-t px-4 py-2 text-sm bg-gray-50/50">
                                      <div className="space-y-1 pl-6">
                                        {(dc.lines || []).map((l, i) => (
                                          <div key={i} className="flex items-center justify-between text-gray-600">
                                            <span>{l.productName} <span className="text-xs text-gray-400">(Req {l.requisitionNo})</span></span>
                                            <span className="font-medium">{l.dcQty}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            )
                          })}
                        </tbody>
                      </table>
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