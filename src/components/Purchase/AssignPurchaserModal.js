"use client"
import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { employeeService } from "../../services/employeeService"
import { projectService } from "../../services/projectService"
import { getErrorMessage } from "../../utils/errorUtils"

export default function AssignPurchaserModal({ projectId, projectName, currentPurchaser, currentPurchasers, onClose, onSave }) {
  const [purchasers, setPurchasers] = useState([])
  const [selectedIds, setSelectedIds] = useState(() => {
    const ids = new Set()
    if (currentPurchaser?.id) ids.add(currentPurchaser.id)
    ;(currentPurchasers || []).forEach((p) => p?.id && ids.add(p.id))
    return ids
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadPurchasers = async () => {
      try {
        const list = await employeeService.getAssignableList("Purchaser")
        setPurchasers(list || [])
      } catch (e) {
        console.error("Error fetching purchasers:", e)
      }
    }
    loadPurchasers()
  }, [])

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (selectedIds.size === 0) { setError("Select at least one purchaser."); return }
    setLoading(true)
    setError("")
    try {
      await projectService.updatePurchasers(projectId, Array.from(selectedIds))
      if (onSave) onSave()
      onClose()
    } catch (e) {
      setError(getErrorMessage(e, "Failed to assign purchasers"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-blue-700">Assign Purchasers - {projectName}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchasers <span className="text-gray-400 font-normal">(select one or more — all selected will see this project's requisitions)</span>
            </label>
            <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
              {purchasers.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No purchasers found.</div>
              ) : (
                purchasers.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-800">{p.firstName} {p.lastName}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || selectedIds.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}