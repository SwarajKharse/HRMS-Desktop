"use client"
import { useState, useEffect, useRef, Fragment } from "react"
import { FiX, FiUpload, FiEdit2, FiLoader, FiCheck } from "react-icons/fi"
import { projectService } from "../../services/projectService"

const fmtDateTime = (s) => { if (!s) return ""; try { return new Date(s).toLocaleString() } catch { return "" } }

const ALLOWED_DC_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
const MAX_DC_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function DCHistoryModal({ projectId, projectName, isOpen, onClose, currentUserId }) {
  const [dcs, setDcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedDC, setExpandedDC] = useState({})
  const [uploadingKey, setUploadingKey] = useState(null) // `${dcId}-signed`
  const [savedKey, setSavedKey] = useState(null)
  const signedCopyInputRefs = useRef({})

  const loadDCs = () => {
    if (!projectId) return
    setLoading(true)
    setError("")
    projectService.getDeliveryChallans(projectId)
      .then((d) => setDcs(Array.isArray(d) ? d : []))
      .catch(() => setError("Failed to load delivery challans."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isOpen || !projectId) return
    loadDCs()
  }, [isOpen, projectId])

  const validateFile = (file) => {
    if (!ALLOWED_DC_FILE_TYPES.includes(file.type)) {
      alert("Only PDF, JPG or PNG files are allowed.")
      return false
    }
    if (file.size > MAX_DC_FILE_SIZE) {
      alert("File must be 5MB or smaller.")
      return false
    }
    return true
  }

  const handleSignedFileSelect = async (dc, file) => {
    if (!file || !validateFile(file)) return
    const key = `${dc.id}-signed`
    setUploadingKey(key)
    try {
      await projectService.uploadSignedDeliveryChallan(dc.id, file, currentUserId)
      loadDCs()
      setSavedKey(key)
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2000)
    } catch (err) {
      alert("Failed to upload signed DC copy: " + (err.response?.data?.message || err.message))
    } finally {
      setUploadingKey(null)
    }
  }

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
        <div className="flex-1 overflow-y-auto p-5">
          {error && <div className="mb-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">{error}</div>}
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : dcs.length === 0 ? (
            <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-8 text-center">
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
                  {dcs.map((dc) => {
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
                            {dc.dcFilePath ? (
                              <div className="flex flex-col gap-0.5">
                                <a href={dc.dcFilePath} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline break-all">
                                  {dc.dcFileName || "View file"}
                                </a>
                                <span className="text-[10px] text-gray-400">{fmtDateTime(dc.createdAt)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              ref={(el) => { signedCopyInputRefs.current[dc.id] = el }}
                              onChange={(e) => { handleSignedFileSelect(dc, e.target.files?.[0]); e.target.value = "" }}
                            />
                            {(() => {
                              const key = `${dc.id}-signed`
                              const isUploading = uploadingKey === key
                              const justSaved = savedKey === key
                              return dc.signedDcFilePath ? (
                                <div className="flex items-start gap-1.5">
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <a href={dc.signedDcFilePath} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:text-green-900 underline break-all">
                                      {dc.signedDcFileName || "Signed copy"}
                                    </a>
                                    <span className="text-[10px] text-gray-400">{fmtDateTime(dc.signedDcUploadedAt)}</span>
                                  </div>
                                  {isUploading ? (
                                    <FiLoader size={12} className="text-gray-400 shrink-0 mt-0.5 animate-spin" />
                                  ) : justSaved ? (
                                    <FiCheck size={14} className="text-green-600 shrink-0 mt-0.5" title="Saved" />
                                  ) : (
                                    <button
                                      onClick={() => signedCopyInputRefs.current[dc.id]?.click()}
                                      className="text-gray-400 hover:text-green-700 shrink-0"
                                      title="Replace signed copy"
                                    >
                                      <FiEdit2 size={12} />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => signedCopyInputRefs.current[dc.id]?.click()}
                                  disabled={isUploading}
                                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 underline disabled:opacity-50"
                                  title="Upload client-signed DC copy"
                                >
                                  {isUploading ? <FiLoader size={12} className="animate-spin" /> : <FiUpload size={12} />}
                                  {isUploading ? "Uploading..." : "Upload signed copy"}
                                </button>
                              )
                            })()}
                          </td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={3} className="border-t px-4 py-2 text-sm bg-gray-50/50">
                              <div className="space-y-1 pl-6">
                                {(dc.lines || []).map((l, i) => (
                                  <div key={i} className="flex items-start justify-between gap-2 text-gray-600">
                                    <span className="min-w-0">{l.productName} <span className="text-xs text-gray-400">(Req {l.requisitionNo})</span></span>
                                    <span className="font-medium shrink-0">{l.dcQty}</span>
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
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )
}