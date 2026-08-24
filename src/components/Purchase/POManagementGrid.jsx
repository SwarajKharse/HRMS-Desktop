"use client"

import { useState, useEffect, useCallback } from "react"
import { comparisonSheetService } from "../../services/comparisonSheetService"
import { purchaseOrderService } from "../../services/purchaseOrderService"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { grnService } from "../../services/grnService"
import { useAuth } from "../../contexts/AuthContext"
import VendorDropdownPOUpload from "./PurchaserComponents/VendorDropdownPOUpload"
import PODetailsModal from "./PurchaserComponents/PODetailsModal"
import { PaymentStatusCell } from "./PurchaserComponents/AmountBreakdownCell"
import { getErrorMessage } from "../../utils/errorUtils"
import { PIUploadModal, GRNUploadModal, UploadPOModal, EditPOModal } from "./PurchaserComponents/POUploadPurchaser"

// ─── Helpers ────────────────────────────────────────────────────────────────
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

// ─── Main Page (PM version) ───────────────────────────────────────────────────
const POManagementGrid = () => {
  const { user } = useAuth()

  const [pos, setPOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)
  const [successMessage, setSuccessMessage] = useState(null)
  const [expandedPOHistory, setExpandedPOHistory] = useState({})

  // PM Approval state
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedPOForApproval, setSelectedPOForApproval] = useState(null)
  const [approvalStatus, setApprovalStatus] = useState("")
  const [approvalRemarks, setApprovalRemarks] = useState("")

  // Gate: force at least one look at View Details before the approval popup opens, so PM
  // isn't approving blind off the badge alone. Tracked in-memory per session.
  const [viewedPOForApproval, setViewedPOForApproval] = useState(() => new Set())
  const [showViewGate, setShowViewGate] = useState(false)
  const [gatePO, setGatePO] = useState(null)
  const [submittingApproval, setSubmittingApproval] = useState(false)

  // Filters
  const [filterPONumber, setFilterPONumber] = useState("")
  const [filterVendor, setFilterVendor] = useState("")
  const [filterProjectName, setFilterProjectName] = useState("")
  const [filterPMApproval, setFilterPMApproval] = useState("")
  const [filterFMApproval, setFilterFMApproval] = useState("")
  const [filterPOStatus, setFilterPOStatus] = useState("")
  const [filterMaterialStatus, setFilterMaterialStatus] = useState("")

  // Modal state
  const [showUploadPOModal, setShowUploadPOModal] = useState(false)
  const [showPIModal, setShowPIModal] = useState(false)
  const [showGRNModal, setShowGRNModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditPOModal, setShowEditPOModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const fetchPOs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await purchaseOrderService.getPurchaseOrdersPaginated({
        page: 0, size: 100, assignedPurchaser: user?.userId || 1,
      })
      const rawList = data.content || data || []
      const poMap = new Map()

      rawList.forEach((po) => {
        const key = po.poNumber
        const mtrCode = po.boqMtr?.mtrCode || ""
        const actualProject = po.projectName || po.boqMtr?.projectName || null
        const poBasicContribution = (po.basicAmount || 0) + (po.miscellaneous || 0) - (po.discount || 0)
        if (!poMap.has(key)) {
          poMap.set(key, {
            ...po,
            projectNames: actualProject ? [actualProject] : [],
            mtrCodes: mtrCode ? [mtrCode] : [],
            allMTRIds: [po.id],
            allMTRData: [po],
            poAmount: po.poAmount || 0,
            poBasicAmount: poBasicContribution,
            paidAmount: po.paidAmount || 0,
            paymentBreakdown: po.paymentBreakdown || [],
          })
        } else {
          const existing = poMap.get(key)
          const latest = po.id > existing.id ? po : existing
          const mergedProjects = [...new Set([...existing.projectNames, ...(actualProject ? [actualProject] : [])])]
          const mergedMTRCodes = [...new Set([...existing.mtrCodes, ...(mtrCode ? [mtrCode] : [])])]
          poMap.set(key, {
            ...latest,
            projectNames: mergedProjects,
            mtrCodes: mergedMTRCodes,
            allMTRIds: [...existing.allMTRIds, po.id],
            allMTRData: [...existing.allMTRData, po],
            poAmount: existing.poAmount + (po.poAmount || 0),
            poBasicAmount: existing.poBasicAmount + poBasicContribution,
            paidAmount: existing.paidAmount + (po.paidAmount || 0),
            paymentBreakdown: [...existing.paymentBreakdown, ...(po.paymentBreakdown || [])],
          })
        }
      })

      const grouped = Array.from(poMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const start = currentPage * pageSize
      setPOs(grouped.slice(start, start + pageSize))
      setTotalPages(Math.ceil(grouped.length / pageSize) || 1)
    } catch (e) {
      console.error("Error fetching POs:", e)
      setPOs([])
    } finally { setLoading(false) }
  }, [currentPage, pageSize, user?.userId])

  useEffect(() => { fetchPOs() }, [fetchPOs])

  const filteredPOs = pos.filter((po) => {
    const matchPO = !filterPONumber || po.poNumber?.toLowerCase().includes(filterPONumber.toLowerCase())
    const matchVendor = !filterVendor || (po.vendorName || po.uploadedBy?.firstName || "").toLowerCase().includes(filterVendor.toLowerCase())
    const matchProject = !filterProjectName || po.projectNames?.some((p) => p.toLowerCase().includes(filterProjectName.toLowerCase()))
    const matchPM = !filterPMApproval || (po.approvalStatus || "PENDING") === filterPMApproval
    const matchFM = !filterFMApproval || (po.financeManagerApprovalStatus || "PENDING") === filterFMApproval
    const matchPOStatus = !filterPOStatus || (po.poStatus || "OPEN") === filterPOStatus
    const matchMaterialStatus = !filterMaterialStatus || (po.materialStatus || "MATERIAL_YET_TO_DISPATCH") === filterMaterialStatus
    return matchPO && matchVendor && matchProject && matchPM && matchFM && matchPOStatus && matchMaterialStatus
  })

  const clearFilters = () => {
    setFilterPONumber(""); setFilterVendor(""); setFilterProjectName("")
    setFilterPMApproval(""); setFilterFMApproval(""); setFilterPOStatus(""); setFilterMaterialStatus("")
  }

  const handleApprovalSubmit = async () => {
    if (!approvalStatus) return
    try {
      setSubmittingApproval(true)
      await purchaseOrderService.updateApprovalStatus(selectedPOForApproval.id, approvalStatus, approvalRemarks, user?.userId)
      showSuccess("Approval updated successfully!")
      setShowApprovalModal(false); setSelectedPOForApproval(null); setApprovalStatus(""); setApprovalRemarks("")
      fetchPOs()
    } catch (err) { console.error("Error updating approval:", err) }
    finally { setSubmittingApproval(false) }
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
            <h2 className="text-2xl font-semibold text-blue-700">Purchase Order Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage POs, approve and track documents</p>
          </div>
          <button onClick={() => setShowUploadPOModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
            Upload PO
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3">
            <input type="text" placeholder="PO Number..." value={filterPONumber} onChange={(e) => setFilterPONumber(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Vendor Name..." value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Project Name..." value={filterProjectName} onChange={(e) => setFilterProjectName(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
            <select value={filterPMApproval} onChange={(e) => setFilterPMApproval(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">All PM Status</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
            </select>
            <select value={filterFMApproval} onChange={(e) => setFilterFMApproval(e.target.value)} className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">All FM Status</option>
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
            <div className="text-center py-12 text-gray-500">No purchase orders found.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Vendor", "Project Name(s)", "PO Number / Copy", "Payment Status", "PM Approval", "FM Approval", "PO Status", "Material Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {po.vendorName || po.boqMtr?.vendorName || (po.uploadedBy ? `${po.uploadedBy.firstName} ${po.uploadedBy.lastName}` : "N/A")}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 max-w-[180px]">
                        <div className="space-y-1">
                          {po.projectNames?.length > 0 ? (
                            po.projectNames.map((name, i) => (
                              <div
                                key={i}
                                className={`truncate text-xs px-2 py-0.5 rounded ${
                                  name === "Project removed by finance"
                                    ? "bg-red-50 text-red-600 font-medium"
                                    : "bg-gray-100"
                                }`}
                                title={name}
                              >
                                {name}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                          <div className="text-xs text-gray-500">{formatDate(po.createdAt)}</div>
                          <div className="flex items-center gap-2">
                            {po.fileUrl && (
                              <button onClick={() => { setSelectedPO(po); setShowDetailsModal(true); setViewedPOForApproval((s) => new Set(s).add(po.id)) }} className="text-blue-600 hover:text-blue-800 text-xs underline">View PO</button>
                            )}
                            {po.approvalStatus !== "APPROVED" && (
                              <button
                                onClick={() => { setSelectedPO(po); setShowEditPOModal(true) }}
                                title="Edit PO"
                                className="text-gray-500 hover:text-blue-600"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                          </div>
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

                      {/* PM Approval — clickable */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              if (viewedPOForApproval.has(po.id)) {
                                setSelectedPOForApproval(po)
                                setApprovalStatus(po.approvalStatus || "PENDING")
                                setApprovalRemarks(po.approvalRemarks || "")
                                setShowApprovalModal(true)
                              } else {
                                setGatePO(po)
                                setShowViewGate(true)
                              }
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <StatusBadge status={po.approvalStatus} />
                          </button>
                          {po.approvalRemarks && (
                            <p className="text-xs text-gray-500 max-w-[120px] truncate" title={po.approvalRemarks}>{po.approvalRemarks}</p>
                          )}
                        </div>
                      </td>

                      {/* FM Approval — read only */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <StatusBadge status={po.financeManagerApprovalStatus} />
                          {po.financeManagerApprovalRemarks && (
                            <p className="text-xs text-gray-500 max-w-[120px] truncate" title={po.financeManagerApprovalRemarks}>{po.financeManagerApprovalRemarks}</p>
                          )}
                        </div>
                      </td>

                      {/* PO Status */}
                      <td className="px-4 py-4">
                        <select
                          value={po.poStatus || "OPEN"}
                          onChange={async (e) => {
                            try {
                              await purchaseOrderService.updatePOStatus(po.id, e.target.value)
                              showSuccess("PO status updated!"); fetchPOs()
                            } catch (err) { console.error("Error updating PO status:", err) }
                          }}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="OPEN">Open</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>

                      {/* Material Status */}
                      <td className="px-4 py-4">
                        <select
                          value={po.materialStatus || "MATERIAL_YET_TO_DISPATCH"}
                          onChange={async (e) => {
                            try {
                              await purchaseOrderService.updateMaterialStatus(po.id, e.target.value)
                              showSuccess("Material status updated!"); fetchPOs()
                            } catch (err) { console.error("Error updating material status:", err) }
                          }}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="MATERIAL_YET_TO_DISPATCH">Yet to Dispatch</option>
                          <option value="IN_TRANSIT">In Transit</option>
                          <option value="RECEIVED">Received</option>
                          <option value="GRN_DONE">GRN Done</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setSelectedPO(po); setShowDetailsModal(true); setViewedPOForApproval((s) => new Set(s).add(po.id)) }}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 font-medium flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                          <button
                            onClick={() => { setSelectedPO(po); setShowPIModal(true) }}
                            disabled={po.approvalStatus !== "APPROVED" || po.financeManagerApprovalStatus !== "APPROVED"}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Upload PI
                          </button>
                          <button
                            onClick={() => { setSelectedPO(po); setShowGRNModal(true) }}
                            disabled={po.materialStatus !== "GRN_DONE"}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Upload GRN/TI
                          </button>
                        </div>
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

      {/* Modals */}
      <UploadPOModal
        isOpen={showUploadPOModal}
        onClose={() => setShowUploadPOModal(false)}
        onSuccess={(msg) => { showSuccess(msg); fetchPOs() }}
        user={user}
      />
      <PODetailsModal
        isOpen={showDetailsModal && selectedPO !== null}
        onClose={() => { setShowDetailsModal(false); setTimeout(() => setSelectedPO(null), 200) }}
        po={selectedPO || {}}
        currentUserId={user?.userId}
        onRefresh={() => { showSuccess("Updated successfully!"); fetchPOs() }}
        isPM={true}
        isPurchaser={true}
      />

      <PIUploadModal
        isOpen={showPIModal}
        onClose={() => { setShowPIModal(false); setSelectedPO(null) }}
        po={selectedPO}
        onSuccess={(msg) => { showSuccess(msg); fetchPOs() }}
      />

      <GRNUploadModal
        isOpen={showGRNModal}
        onClose={() => { setShowGRNModal(false); setSelectedPO(null) }}
        po={selectedPO}
        onSuccess={(msg) => { showSuccess(msg); fetchPOs() }}
      />

      <EditPOModal
        isOpen={showEditPOModal}
        onClose={() => { setShowEditPOModal(false); setSelectedPO(null) }}
        po={selectedPO}
        onSuccess={(msg) => { showSuccess(msg); fetchPOs() }}
        user={user}
      />

      {/* View-before-approve gate */}
      {showViewGate && gatePO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="p-6 text-center space-y-4">
              <p className="text-sm font-medium text-gray-800">Please check the PO details before approving {gatePO.poNumber}.</p>
              <button
                onClick={() => {
                  setViewedPOForApproval((s) => new Set(s).add(gatePO.id))
                  setShowViewGate(false)
                  setSelectedPO(gatePO)
                  setShowDetailsModal(true)
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  setViewedPOForApproval((s) => new Set(s).add(gatePO.id))
                  setShowViewGate(false)
                  setSelectedPOForApproval(gatePO)
                  setApprovalStatus(gatePO.approvalStatus || "PENDING")
                  setApprovalRemarks(gatePO.approvalRemarks || "")
                  setShowApprovalModal(true)
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
              >
                ✕ I've already seen it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PM Approval Modal */}
      {showApprovalModal && selectedPOForApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">PM Approval — {selectedPOForApproval.poNumber}</h3>
              <button onClick={() => setShowApprovalModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={approvalRemarks} onChange={(e) => setApprovalRemarks(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" rows={3} placeholder="Add remarks..." />
              </div>
            </div>
            <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowApprovalModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={handleApprovalSubmit} disabled={!approvalStatus || submittingApproval} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">
                {submittingApproval ? "Saving..." : "Save Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POManagementGrid