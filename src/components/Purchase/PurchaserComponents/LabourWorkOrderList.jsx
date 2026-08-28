"use client"

import { useState, useEffect, useCallback } from "react"
import { FiX, FiPlus } from "react-icons/fi"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { getErrorMessage } from "../../../utils/errorUtils"
import ComparisionSheetModal from "./ComparisionSheetModal"

const fmtDate = (d) => {
  if (!d) return "N/A"
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

const StatusBadge = ({ status }) => {
  const s = (status || "DRAFT").toUpperCase()
  const cls =
    s === "APPROVED"
      ? "bg-green-100 text-green-800"
      : s === "REJECTED"
      ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800"
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{s}</span>
}

// History page for a project's Labour Work Orders. The Purchase Manager approves /
// rejects from here; the purchaser edits an existing one or starts a new one.
export default function LabourWorkOrderList({ projectId, projectName, assignedPurchaser, mode = "purchaser", onClose }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(null) // { comparisonSheetId } | { create: true }

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setList(await comparisonSheetService.getLabourWorkOrders(projectId))
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load labour work orders."))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  if (open) {
    const isCreate = !!open.create
    return (
      <ComparisionSheetModal
        mode={isCreate ? "purchaser" : mode}
        labourContext={{
          projectId,
          projectName,
          assignedPurchaser,
          comparisonSheetId: open.comparisonSheetId || null,
        }}
        onClose={() => setOpen(null)}
        onSave={() => {
          fetchList()
          setOpen(null)
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-amber-50">
          <h3 className="text-lg font-bold text-amber-800">
            Labour Work Orders{projectName ? ` — ${projectName}` : ""}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border-b">
          <p className="text-sm text-gray-500">
            {mode === "manager"
              ? "Review the vendor comparison and approve or reject a vendor for each work order."
              : "Open a work order to fill the vendor comparison, or start a new one."}
          </p>
          <button
            onClick={() => setOpen({ create: true })}
            className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            New Labour Work Order
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No labour work orders yet. Click “New Labour Work Order” to create the first one.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Created", "Items", "Vendor", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {list.map((wo) => (
                    <tr key={wo.comparisonSheetId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDate(wo.createdDate)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">{wo.itemCount} item(s)</div>
                        {wo.itemsPreview && <div className="text-xs text-gray-500 max-w-md truncate">{wo.itemsPreview}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{wo.selectedVendorName || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={wo.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setOpen({ comparisonSheetId: wo.comparisonSheetId })}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                        >
                          {mode === "manager"
                            ? "Review & Approve"
                            : wo.status === "APPROVED"
                            ? "View"
                            : "Open"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
