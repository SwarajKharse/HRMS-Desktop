"use client"

import { useState, useEffect, useCallback } from "react"
import { financePayableService } from "../../services/financePayableService"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { useAuth } from "../../contexts/AuthContext"
import PODetailsModal from "../Purchase/PurchaserComponents/PODetailsModal"
import { employeeService } from "../../services/employeeService"
import { PaymentStatusCell } from "../Purchase/PurchaserComponents/AmountBreakdownCell"

const formatDate = (d) => {
  if (!d) return "N/A"
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

const StatusBadge = ({ status }) => {
  const color =
    status === "APPROVED"
      ? "bg-green-100 text-green-800"
      : status === "REJECTED"
      ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800"
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status || "PENDING"}
    </span>
  )
}

// ─── Assign Accountant Dropdown ───────────────────────────────────────────────
function AssignAccountantCell({ po, onAssigned }) {
  const [accountants, setAccountants] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [currentName, setCurrentName] = useState(null)
  const [changing, setChanging] = useState(false)

  const poIds = po.allMTRIds?.length ? po.allMTRIds : [po.id]

  useEffect(() => {
    employeeService.getAssignableList("Accountant")
      .then(setAccountants)
      .catch(() => setAccountants([]))
  }, [])

  const loadCurrentAssignment = async () => {
    try {
      const pisByPO = await Promise.all(poIds.map((id) => purchaseInvoiceService.getPurchaseInvoicesByPO(id)))
      const pis = pisByPO.flat()
      const assignedPI = pis.find((pi) => pi.assignedAccountant)
      if (assignedPI) {
        setCurrentName(`${assignedPI.assignedAccountant.firstName} ${assignedPI.assignedAccountant.lastName}`)
      } else {
        setCurrentName(null)
      }
    } catch (e) {
      console.error("Error loading current accountant assignment:", e)
    }
  }

  useEffect(() => {
    loadCurrentAssignment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [po.poNumber])

  const handleAssign = async () => {
    if (!selectedId) return
    try {
      setAssigning(true)
      // A grouped PO row can span multiple underlying PurchaseOrder ids (one per MTR
      // line) — fetch PIs across all of them, not just the "latest" po.id, or PIs
      // attached to sibling lines get silently skipped.
      const pisByPO = await Promise.all(poIds.map((id) => purchaseInvoiceService.getPurchaseInvoicesByPO(id)))
      const pis = pisByPO.flat()
      if (pis.length === 0) {
        console.error("No PIs found for this PO yet — nothing to assign.")
        return
      }
      await Promise.all(
       (pis || []).map((pi) => purchaseInvoiceService.assignAccountant(pi.id, Number(selectedId)))
      )
      setChanging(false)
      await loadCurrentAssignment()
      if (onAssigned) onAssigned()
    } catch (e) {
      console.error("Error assigning accountant:", e)
    } finally {
      setAssigning(false)
    }
  }

  if (currentName && !changing) {
    return (
      <div className="flex flex-col gap-1 min-w-[160px]">
        <span className="text-xs text-green-700 font-medium">✓ {currentName}</span>
        <button onClick={() => setChanging(true)} className="text-[11px] text-blue-600 hover:text-blue-800 underline text-left">Change</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Accountant</option>
        {accountants.map((a) => (
          <option key={a.id} value={a.id}>
            {a.firstName} {a.lastName}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <button
          onClick={handleAssign}
          disabled={!selectedId || assigning}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          {assigning ? "Assigning..." : "Assign"}
        </button>
        {currentName && (
          <button onClick={() => setChanging(false)} className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">Cancel</button>
        )}
      </div>
    </div>
  )
}

// ─── Main AM Payable Page ─────────────────────────────────────────────────────
const Payable = () => {
  const { user } = useAuth()

  const [pos, setPOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filters
  const [filterPONumber, setFilterPONumber] = useState("")
  const [filterVendor, setFilterVendor] = useState("")
  const [filterProjectName, setFilterProjectName] = useState("")
  const [filterPMApproval, setFilterPMApproval] = useState("")
  const [filterPOStatus, setFilterPOStatus] = useState("")
  const [filterMaterialStatus, setFilterMaterialStatus] = useState("")

  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const fetchPOs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await financePayableService.getAllPayables(0, 100)
      const rawList = Array.isArray(data) ? data : (data.content || [])

      // Group by poNumber FIRST — a multi-item PO has one underlying row per MTR line,
      // and filtering rows individually before grouping would drop sibling lines out of
      // the total (e.g. showing only one line's amount instead of the whole PO's).
      const poMap = new Map()
      rawList.forEach((po) => {
        const key = po.poNumber
        const poBasicContribution = (po.basicAmount || 0) + (po.miscellaneous || 0) - (po.discount || 0)
        const isFmApproved = po.financeManagerApprovalStatus === "APPROVED"
        if (!poMap.has(key)) {
          poMap.set(key, {
            ...po,
            projectNames: po.projectName ? [po.projectName] : [],
            allMTRIds: [po.id],
            allMTRData: [po],
            poAmount: po.poAmount || 0,
            poBasicAmount: poBasicContribution,
            paidAmount: po.paidAmount || 0,
            paymentBreakdown: po.paymentBreakdown || [],
            anyFmApproved: isFmApproved,
          })
        } else {
          const existing = poMap.get(key)
          const latest = po.id > existing.id ? po : existing
          const mergedProjects = [...new Set([...existing.projectNames, ...(po.projectName ? [po.projectName] : [])])]
          poMap.set(key, {
            ...latest,
            projectNames: mergedProjects,
            allMTRIds: [...existing.allMTRIds, po.id],
            allMTRData: [...existing.allMTRData, po],
            poAmount: existing.poAmount + (po.poAmount || 0),
            poBasicAmount: existing.poBasicAmount + poBasicContribution,
            paidAmount: existing.paidAmount + (po.paidAmount || 0),
            paymentBreakdown: [...existing.paymentBreakdown, ...(po.paymentBreakdown || [])],
            anyFmApproved: existing.anyFmApproved || isFmApproved,
          })
        }
      })

      // Only show POs where FM has approved at least one line — once shown, the group's
      // full amount (across all lines) is what's displayed.
      const grouped = Array.from(poMap.values())
        .filter((po) => po.anyFmApproved)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const start = currentPage * pageSize
      setPOs(grouped.slice(start, start + pageSize))
      setTotalPages(Math.ceil(grouped.length / pageSize) || 1)
    } catch (e) {
      console.error("Error fetching payables:", e)
      setPOs([])
    } finally { setLoading(false) }
  }, [currentPage, pageSize])

  useEffect(() => { fetchPOs() }, [fetchPOs])

  const filteredPOs = pos.filter((po) => {
    const matchPO = !filterPONumber || po.poNumber?.toLowerCase().includes(filterPONumber.toLowerCase())
    const matchVendor = !filterVendor || (po.vendorName || "").toLowerCase().includes(filterVendor.toLowerCase())
    const matchProject = !filterProjectName || po.projectNames?.some((p) => p.toLowerCase().includes(filterProjectName.toLowerCase()))
    const matchPM = !filterPMApproval || (po.approvalStatus || "PENDING") === filterPMApproval
    const matchPOStatus = !filterPOStatus || (po.poStatus || "OPEN") === filterPOStatus
    const matchMaterialStatus = !filterMaterialStatus || (po.materialStatus || "MATERIAL_YET_TO_DISPATCH") === filterMaterialStatus
    return matchPO && matchVendor && matchProject && matchPM && matchPOStatus && matchMaterialStatus
  })

  const clearFilters = () => {
    setFilterPONumber(""); setFilterVendor(""); setFilterProjectName("")
    setFilterPMApproval(""); setFilterPOStatus(""); setFilterMaterialStatus("")
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {successMessage}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-blue-700">Accounts Payable</h2>
            <p className="text-sm text-gray-500 mt-1">FM approved POs — assign accountants and review</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <input type="text" placeholder="PO Number..." value={filterPONumber} onChange={(e) => setFilterPONumber(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Vendor Name..." value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Project Name..." value={filterProjectName} onChange={(e) => setFilterProjectName(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            <select value={filterPMApproval} onChange={(e) => setFilterPMApproval(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">All PM Status</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
            </select>
            <select value={filterPOStatus} onChange={(e) => setFilterPOStatus(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">All PO Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select value={filterMaterialStatus} onChange={(e) => setFilterMaterialStatus(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">All Material Status</option>
              <option value="MATERIAL_YET_TO_DISPATCH">Yet to Dispatch</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="RECEIVED">Received</option>
              <option value="GRN_DONE">GRN Done</option>
            </select>
            <button onClick={clearFilters} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium">Clear Filters</button>
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="relative w-10 h-10">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No FM-approved POs found.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Vendor", "Project Name(s)", "PO Number / Copy", "Payment Status", "PM Approval", "FM Approval", "PO Status", "Material Status", "Assign Accountant", "Actions"].map((h) => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${h === "Actions" ? "sticky right-0 bg-gray-50 shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.15)]" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      {/* Vendor */}
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {po.vendorName || "N/A"}
                      </td>
                      {/* Project Names */}
                      <td className="px-4 py-4 max-w-[160px]">
                        <div className="space-y-1">
                          {po.projectNames?.length > 0 ? (
                            po.projectNames.map((name, i) => (
                              <div key={i} className="truncate text-xs bg-gray-100 px-2 py-0.5 rounded" title={name}>{name}</div>
                            ))
                          ) : <span className="text-gray-400 text-xs">N/A</span>}
                        </div>
                      </td>
                      {/* PO Number */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                          <div className="text-xs text-gray-500">{formatDate(po.createdAt)}</div>
                          {po.fileUrl && <button onClick={() => { setSelectedPO(po); setShowDetailsModal(true) }} className="text-blue-600 text-xs underline">View PO</button>}
                        </div>
                      </td>
                      {/* Payment Status */}
                      <td className="px-4 py-4">
                        <PaymentStatusCell
                          poBasicAmount={po.poBasicAmount}
                          poAmount={po.poAmount}
                          paidAmount={po.paidAmount}
                          breakdown={po.paymentBreakdown}
                        />
                      </td>
                      {/* PM Approval — read only */}
                      <td className="px-4 py-4">
                        <StatusBadge status={po.approvalStatus} />
                      </td>
                      {/* FM Approval — read only */}
                      <td className="px-4 py-4">
                        <StatusBadge status={po.financeManagerApprovalStatus} />
                      </td>
                      {/* PO Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={po.poStatus || "OPEN"} />
                      </td>
                      {/* Material Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={po.materialStatus} />
                      </td>
                      {/* Assign Accountant */}
                      <td className="px-4 py-4">
                        <AssignAccountantCell
                          po={po}
                          onAssigned={() => showSuccess("Accountant assigned!")}
                        />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-4 sticky right-0 bg-white shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.15)]">
                        <button
                          onClick={() => { setSelectedPO(po); setShowDetailsModal(true) }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 font-medium flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          )}
        </div>
      </div>

      <PODetailsModal
        isOpen={showDetailsModal && selectedPO !== null}
        onClose={() => { setShowDetailsModal(false); setTimeout(() => setSelectedPO(null), 200) }}
        po={selectedPO || {}}
        currentUserId={user?.userId}
        onRefresh={() => { showSuccess("Updated!"); fetchPOs() }}
        isAM={true}
      />
    </div>
  )
}

export default Payable