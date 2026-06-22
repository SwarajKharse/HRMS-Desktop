"use client"
import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { employeeService } from "../../services/employeeService"
import { projectService } from "../../services/projectService"

export default function AssignPurchaserModal({ projectId, projectName, currentPurchaser, onClose, onSave }) {
  const [purchasers, setPurchasers] = useState([])
  const [selectedPurchaser, setSelectedPurchaser] = useState(currentPurchaser?.id ? String(currentPurchaser.id) : "")
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

  const handleSave = async () => {
    if (!selectedPurchaser) { setError("Select a purchaser first."); return }
    setLoading(true)
    setError("")
    try {
      await projectService.updateProjectDetails(projectId, { purchaser: Number.parseInt(selectedPurchaser, 10) })
      if (onSave) onSave()
      onClose()
    } catch (e) {
      setError("Failed to assign purchaser: " + (e?.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-blue-700">Assign Purchaser - {projectName}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchaser</label>
            <select
              value={selectedPurchaser}
              onChange={(e) => setSelectedPurchaser(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Select Purchaser --</option>
              {purchasers.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedPurchaser}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}