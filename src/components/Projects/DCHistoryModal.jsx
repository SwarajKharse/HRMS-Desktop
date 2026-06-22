"use client"
import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { projectService } from "../../services/projectService"

const fmtDateTime = (s) => { if (!s) return ""; try { return new Date(s).toLocaleString() } catch { return "" } }

export default function DCHistoryModal({ projectId, projectName, isOpen, onClose }) {
  const [dcs, setDcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedDC, setExpandedDC] = useState({})

  useEffect(() => {
    if (!isOpen || !projectId) return
    setLoading(true)
    setError("")
    projectService.getDeliveryChallans(projectId)
      .then((d) => setDcs(Array.isArray(d) ? d : []))
      .catch(() => setError("Failed to load delivery challans."))
      .finally(() => setLoading(false))
  }, [isOpen, projectId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b gap-2">
          <h2 className="text-base md:text-lg font-semibold text-blue-900 truncate">DC History — {projectName || "Project"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none shrink-0">
            <FiX />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">{error}</div>}
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : dcs.length === 0 ? (
            <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-8 text-center">
              No delivery challans created yet for this project.
            </div>
          ) : (
            dcs.map((dc) => {
              const open = !!expandedDC[dc.id]
              return (
                <div key={dc.id} className="border border-gray-200 rounded-md">
                  <div className="flex flex-col gap-1 px-4 py-2 md:flex-row md:items-center md:justify-between md:gap-0">
                    <button onClick={() => setExpandedDC((p) => ({ ...p, [dc.id]: !p[dc.id] }))}
                      className="flex items-center gap-2 text-left min-w-0 md:flex-1">
                      <span className="text-gray-500 w-4">{open ? "▾" : "▸"}</span>
                      <span className="font-semibold text-gray-800 truncate">{dc.dcNumber}</span>
                      <span className="text-xs text-gray-400 shrink-0">({(dc.lines || []).length} item{(dc.lines || []).length !== 1 ? "s" : ""})</span>
                    </button>
                    <span className="flex items-center flex-wrap gap-x-3 gap-y-1 pl-6 md:pl-0 md:shrink-0">
                      {dc.dcFilePath && (
                        <a href={dc.dcFilePath} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline break-all">
                          {dc.dcFileName || "View file"}
                        </a>
                      )}
                      <span className="text-xs text-gray-400">{fmtDateTime(dc.createdAt)}</span>
                    </span>
                  </div>
                  {open && (
                    <div className="border-t px-4 py-2 text-sm space-y-1">
                      {(dc.lines || []).map((l, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-gray-600">
                          <span className="min-w-0">{l.productName} <span className="text-xs text-gray-400">(Req {l.requisitionNo})</span></span>
                          <span className="font-medium shrink-0">{l.dcQty}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )
}