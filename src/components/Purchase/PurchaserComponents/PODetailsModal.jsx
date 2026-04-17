"use client"

import { useState, useEffect } from "react"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"
import { grnService } from "../../../services/grnService"
import { financePayableService } from "../../../services/financePayableService"

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return "N/A"
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

const StatusBadge = ({ status }) => {
  const color =
    status === "APPROVED" || status === "Approve" || status === "PAID"
      ? "bg-green-100 text-green-800"
      : status === "REJECTED" || status === "Revision from Purchase"
      ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800"
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status || "PENDING"}
    </span>
  )
}

const InfoCell = ({ label, children }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <div className="text-sm font-medium text-gray-900">{children ?? "N/A"}</div>
  </div>
)

const BadgeCell = ({ label, status, onClick }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    {onClick ? (
      <button onClick={onClick} className="hover:opacity-75 transition-opacity">
        <StatusBadge status={status} />
      </button>
    ) : (
      <StatusBadge status={status} />
    )}
  </div>
)

// ─── Approval Popup ───────────────────────────────────────────────────────────
function ApprovalPopup({ isOpen, onClose, title, currentStatus, currentRemarks, onSubmit, submitting, infoMessage }) {
  const [status, setStatus] = useState(currentStatus || "PENDING")
  const [remarks, setRemarks] = useState(currentRemarks || "")

  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus || "PENDING")
      setRemarks(currentRemarks || "")
    }
  }, [isOpen, currentStatus, currentRemarks])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {infoMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">{infoMessage}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" rows={3} placeholder="Add remarks..." />
          </div>
        </div>
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm" disabled={submitting}>Cancel</button>
          <button onClick={() => onSubmit(status, remarks)} disabled={!status || submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Accountant Section (Step 1 + Step 3) ────────────────────────────────────
function AccountantSection({ item, itemType, currentUserId, canEdit, onRefresh }) {
  const [paymentCycles, setPaymentCycles] = useState([])
  const [formData, setFormData] = useState({
    status: item.status || "",
    paymentCycle: item.paymentCycle || "",
    expectedPaymentDate: item.expectedPaymentDate || "",
    payableAmount: item.payableAmount || "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Step 3
  const [paymentDoneDate, setPaymentDoneDate] = useState(item.paymentDoneDate ? item.paymentDoneDate.split("T")[0] : "")
  const [receiptFile, setReceiptFile] = useState(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)

  useEffect(() => {
    if (canEdit) {
      purchaseInvoiceService.getPaymentCycles()
        .then(setPaymentCycles)
        .catch(() => setPaymentCycles([]))
    }
  }, [canEdit])

  // Step 1 — save payment details
    const handleSave = async () => {
    if (!formData.status || !formData.paymentCycle || !formData.expectedPaymentDate || !formData.payableAmount) return
    try {
      setSaving(true)
      if (itemType === "GRN") {
        await grnService.updateGRNForm(item.id, {
          status: formData.status,
          payableAmount: String(formData.payableAmount),
          paymentCycle: formData.paymentCycle,
          expectedPaymentDate: formData.expectedPaymentDate,
        })
      } else {
        await purchaseInvoiceService.updatePurchaseInvoiceForm(item.id, {
          status: formData.status,
          payableAmount: String(formData.payableAmount),
          paymentCycle: formData.paymentCycle,
          expectedPaymentDate: formData.expectedPaymentDate,
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (onRefresh) onRefresh()
    } catch (e) {
      console.error("Error saving data:", e)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitPayment = async () => {
    if (!paymentDoneDate) return
    try {
      setSubmittingPayment(true)
      if (itemType === "GRN") {
        await grnService.completeGRNPayment(item.id, null, paymentDoneDate, receiptFile)
      } else {
        await purchaseInvoiceService.completePayment(item.id, null, paymentDoneDate, receiptFile)
      }
      setReceiptFile(null)
      setPaymentSaved(true)
      setTimeout(() => setPaymentSaved(false), 2000)
      if (onRefresh) onRefresh()
    } catch (e) {
      console.error("Error submitting payment:", e)
    } finally {
      setSubmittingPayment(false)
    }
  }

  return (
    <div className="pt-2 border-t border-blue-100 space-y-3">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Accountant Section</p>

      {/* Read-only for non-accountant */}
      {!canEdit ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InfoCell label="Status">{item.status}</InfoCell>
            <InfoCell label="Payment Cycle">{item.paymentCycle}</InfoCell>
            <InfoCell label="Expected Payment Date">{formatDate(item.expectedPaymentDate)}</InfoCell>
            <InfoCell label="Payable Amount">₹{item.payableAmount || "0"}</InfoCell>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <InfoCell label="AM Approval"><StatusBadge status={item.accountManagerApprovalStatus} /></InfoCell>
            <InfoCell label="Payment Status"><StatusBadge status={item.paymentStatus} /></InfoCell>
            <InfoCell label="AM Remark">{item.accountManagerApprovalRemarks}</InfoCell>
            <InfoCell label="Payment Date">{formatDate(item.paymentDoneDate)}</InfoCell>
          </div>
          {item.paymentReceiptUrl && (
            <div>
              <a href={item.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View Payment Receipt</a>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Step 1: Payment Details ─────────────────────────── */}
          <p className="text-xs font-medium text-gray-600">Step 1 — Payment Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Status <span className="text-red-400">*</span></p>
              <select
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Approve">Approve</option>
                <option value="In progress">In progress</option>
                <option value="Revision from Purchase">Revision from Purchase</option>
              </select>
            </div>
            {formData.status !== "Revision from Purchase" && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Payment Cycle <span className="text-red-400">*</span></p>
                <select
                  value={formData.paymentCycle}
                  onChange={(e) => setFormData((p) => ({ ...p, paymentCycle: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {paymentCycles.map((c) => (
                    <option key={c.day} value={c.day}>{c.day}</option>
                  ))}
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            )}
          </div>
          {formData.status !== "Revision from Purchase" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Expected Payment Date <span className="text-red-400">*</span></p>
                <input
                  type="date"
                  value={formData.expectedPaymentDate ? formData.expectedPaymentDate.split("T")[0] : ""}
                  onChange={(e) => setFormData((p) => ({ ...p, expectedPaymentDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Payable Amount <span className="text-red-400">*</span></p>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payableAmount}
                    onChange={(e) => setFormData((p) => ({ ...p, payableAmount: e.target.value }))}
                    className="w-full pl-6 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !formData.status}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "✓ Saved" : "Save Details"}
            </button>
          </div>

          {/* ── Step 3: Payment Done Date + Receipt ─────────────── */}
            <div className={`pt-3 border-t border-gray-100 space-y-3 ${item.accountManagerApprovalStatus !== "APPROVED" ? "opacity-40 pointer-events-none" : ""}`}>
              <p className="text-xs font-medium text-gray-600">
               Step 3 — Payment Completion
              {item.accountManagerApprovalStatus !== "APPROVED" && (
              <span className="ml-2 text-yellow-600 font-normal">(Locked until AM approves)</span>
              )}
             </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Payment Done Date <span className="text-red-400">*</span></p>
                <input
                  type="date"
                  value={paymentDoneDate}
                  onChange={(e) => setPaymentDoneDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Payment Receipt</p>
                {item.paymentReceiptUrl && (
                  <a href={item.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline block mb-1">View Existing Receipt</a>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="text-xs border border-gray-300 rounded-md p-1 w-full"
                />
                {receiptFile && <p className="text-xs text-green-600 mt-0.5">✓ {receiptFile.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
              <InfoCell label="Payment Status"><StatusBadge status={item.paymentStatus} /></InfoCell>
              {item.paymentReceiptUrl && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Payment Receipt</p>
                  <a href={item.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">View Receipt</a>
                </div>
              )}
            </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSubmitPayment}
                disabled={submittingPayment || !paymentDoneDate}
                className="px-4 py-1.5 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 disabled:opacity-50"
              >
                {submittingPayment ? "Submitting..." : paymentSaved ? "✓ Submitted" : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AMApprovalSection({ item, currentUserId, canApprove, onRefresh, itemType }) {
  const [showPopup, setShowPopup] = useState(false)
  const [submitting, setSubmitting] = useState(false)

    const handleAMApprove = async (status, remarks) => {
    try {
      setSubmitting(true)
      if (itemType === "GRN") {
        await grnService.completeGRNPayment(item.id, status, null, null)
      } else {
        await purchaseInvoiceService.completePayment(item.id, status, null, null)
      }
      setShowPopup(false)
      if (onRefresh) onRefresh()
    } catch (e) {
      console.error("Error in AM approval:", e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-2 border-t border-gray-100 space-y-3">
      <p className="text-xs font-medium text-gray-600">Step 2 — AM Approval</p>
      <div className="grid grid-cols-2 gap-3">
        <BadgeCell
          label="AM Approval"
          status={item.accountManagerApprovalStatus}
          onClick={canApprove ? () => setShowPopup(true) : undefined}
        />
        <InfoCell label="AM Remark">{item.accountManagerApprovalRemarks}</InfoCell>
      </div>
      {canApprove && (
        <ApprovalPopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          title={`AM Approval — ${item.piNumber || item.grnNumber}`}
          currentStatus={item.accountManagerApprovalStatus}
          currentRemarks={item.accountManagerApprovalRemarks}
          onSubmit={handleAMApprove}
          submitting={submitting}
          infoMessage="This sets the AM approval status for this payment."
        />
      )}
    </div>
  )
}

// ─── Main PODetailsModal ──────────────────────────────────────────────────────
/**
 * Props:
 *   isOpen        — boolean
 *   onClose       — function
 *   po            — PO object
 *   currentUserId — logged in user id
 *   onRefresh     — called after any action to refresh parent
 *   isFM          — Finance Manager: FM approval clickable on PI + GRN
 *   isPM          — Purchase Manager: PM approval clickable on PI + GRN
 *   isAM          — Accounts Manager: AM approval + all accountant steps
 *   isAccountant  — Accountant: Step 1 (payment details) + Step 3 (upload receipt)
 *   (nothing)     — Purchaser: read-only
 */
function PODetailsModal({
  isOpen,
  onClose,
  po,
  currentUserId,
  onRefresh,
  isFM = false,
  isPM = false,
  isAM = false,
  isAccountant = false,
}) {
  const [piList, setPIList] = useState([])
  const [grnList, setGrnList] = useState([])
  const [loading, setLoading] = useState(false)

  // canEditAccountant = accountant OR AM
  const canEditAccountant = isAccountant || isAM

  // Approval popup state
  const [approvalPopup, setApprovalPopup] = useState({
    open: false, title: "", currentStatus: "", currentRemarks: "", infoMessage: "", onSubmit: null,
  })
  const [submitting, setSubmitting] = useState(false)

  const openPopup = ({ title, currentStatus, currentRemarks, infoMessage, onSubmit }) => {
    setApprovalPopup({ open: true, title, currentStatus, currentRemarks, infoMessage, onSubmit })
  }

  const closePopup = () => {
    setApprovalPopup({ open: false, title: "", currentStatus: "", currentRemarks: "", infoMessage: "", onSubmit: null })
  }

  const handlePopupSubmit = async (status, remarks) => {
    if (!approvalPopup.onSubmit) return
    try {
      setSubmitting(true)
      await approvalPopup.onSubmit(status, remarks)
      closePopup()
      fetchDetails()
      if (onRefresh) onRefresh()
    } catch (e) {
      console.error("Approval error:", e)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Approval handlers ────────────────────────────────────────────────────

  const handleFMApprovePI = (pi) => openPopup({
    title: `FM Approval — ${pi.piNumber}`,
    currentStatus: pi.financeManagerApproval || "PENDING",
    currentRemarks: pi.financeManagerApprovalRemarks || "",
    infoMessage: "Setting to APPROVED will auto-handover this PI to Accounts.",
    onSubmit: async (status, remarks) => {
      await financePayableService.approvePIApproval(pi.id, status, remarks, currentUserId)
      if (status === "APPROVED") {
        try { await financePayableService.handoverToPurchase(pi.id, currentUserId) } catch (e) { console.error(e) }
      }
    },
  })

  const handleFMApproveGRN = (grn) => openPopup({
    title: `FM Approval — ${grn.grnNumber}`,
    currentStatus: grn.purchaseOrder?.financeManagerApprovalStatus || "PENDING",
    currentRemarks: grn.purchaseOrder?.financeManagerApprovalRemarks || "",
    infoMessage: "This updates the FM approval on the associated PO.",
    onSubmit: async (status, remarks) => {
      await financePayableService.approveOrRejectPayable(grn.purchaseOrder?.id, status, remarks, currentUserId)
    },
  })

  const handlePMApprovePI = (pi) => openPopup({
    title: `PM Approval — ${pi.piNumber}`,
    currentStatus: pi.approvalStatus || "PENDING",
    currentRemarks: pi.approvalRemarks || "",
    infoMessage: "",
    onSubmit: async (status, remarks) => {
      await purchaseInvoiceService.approvePurchaseInvoice(pi.id, {
        approvalStatus: status, remarks, approvedBy: currentUserId,
      })
    },
  })

  const handlePMApproveGRN = (grn) => openPopup({
    title: `PM Approval — ${grn.grnNumber}`,
    currentStatus: grn.purchaseManagerApprovalStatus || "PENDING",
    currentRemarks: grn.purchaseManagerApprovalRemarks || "",
    infoMessage: "",
    onSubmit: async (status, remarks) => {
      await grnService.approveGRN(grn.id, { approvalStatus: status, remarks, approvedBy: currentUserId })
    },
  })

  useEffect(() => {
    if (isOpen && po?.id) fetchDetails()
  }, [isOpen, po?.id])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const [pis, grns] = await Promise.all([
        purchaseInvoiceService.getPurchaseInvoicesByPO(po.id).catch(() => []),
        grnService.getGRNsByPO(po.id).catch(() => []),
      ])
      setPIList(pis || [])
      setGrnList(grns || [])
    } catch (e) {
      console.error("Error fetching PO details:", e)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !po?.id) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">PO Details - {po.poNumber}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* PO Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Purchase Order Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoCell label="PO Number">{po.poNumber}</InfoCell>
              <InfoCell label="Created By">{po.uploadedByName}</InfoCell>
              <InfoCell label="Created Date">{formatDate(po.createdAt)}</InfoCell>
              <InfoCell label="Vendor">{po.vendorName}</InfoCell>
              <InfoCell label="PO Status"><StatusBadge status={po.poStatus} /></InfoCell>
              <InfoCell label="Material Status"><StatusBadge status={po.materialStatus} /></InfoCell>
              <BadgeCell label="PM Approval" status={po.approvalStatus} />
              <BadgeCell label="FM Approval" status={po.financeManagerApprovalStatus} />
            </div>
            {po.fileUrl && (
              <div className="mt-3">
                <a href={po.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View PO Document</a>
              </div>
            )}
          </div>

          {/* MTR Details */}
          {po.allMTRIds && po.allMTRIds.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">MTR Details ({po.allMTRIds.length} items)</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["MTR Code", "Project", "Product", "Qty"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(po.allMTRData || [po]).map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-medium text-gray-700">{entry.mtrCode || entry.boqMtr?.mtrCode || "N/A"}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{entry.projectName || "N/A"}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{entry.productName || "N/A"}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 font-medium">{entry.boqMtr?.purchaseMTR || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          ) : (
            <>
              {/* ── GRNs ─────────────────────────────────────────────── */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Goods Receipt Notes ({grnList.length})</h4>
                {grnList.length === 0 ? (
                  <p className="text-sm text-gray-500">No GRNs uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {grnList.map((grn, idx) => (
                      <div key={grn.id || idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        {/* Row 1 */}
                        <div className="grid grid-cols-2 gap-4">
                          <InfoCell label="GRN Number">{grn.grnNumber}</InfoCell>
                          <InfoCell label="Payable Amount">₹{grn.payableAmount || "0"}</InfoCell>
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-2 gap-4">
                          <InfoCell label="Expected Date">{formatDate(grn.expectedPayableDate)}</InfoCell>
                          <InfoCell label="Uploaded At">{formatDate(grn.createdAt)}</InfoCell>
                        </div>
                        {/* Row 3 — PM + FM */}
                        <div className="grid grid-cols-2 gap-4">
                          <BadgeCell label="PM Approval" status={grn.purchaseManagerApprovalStatus}
                            onClick={isPM ? () => handlePMApproveGRN(grn) : undefined} />
                          <BadgeCell label="FM Approval" status={grn.purchaseOrder?.financeManagerApprovalStatus}
                            onClick={isFM ? () => handleFMApproveGRN(grn) : undefined} />
                        </div>
                        {/* Row 4 — PM + FM remarks */}
                        <div className="grid grid-cols-2 gap-4">
                          <InfoCell label="PM Remark">{grn.purchaseManagerApprovalRemarks}</InfoCell>
                          <InfoCell label="FM Remark">{grn.purchaseOrder?.financeManagerApprovalRemarks}</InfoCell>
                        </div>
                        <div className={`${grn.purchaseOrder?.financeManagerApprovalStatus !== "APPROVED" ? "opacity-40 pointer-events-none" : ""}`}>
                          {grn.purchaseOrder?.financeManagerApprovalStatus !== "APPROVED" && (
                            <p className="text-xs text-yellow-600 font-medium mb-1">⚠ Locked until FM approves</p>
                          )}
                          <AccountantSection
                            item={grn}
                            itemType="GRN"
                            currentUserId={currentUserId}
                            canEdit={canEditAccountant}
                            onRefresh={fetchDetails}
                          />
                          <AMApprovalSection
                            item={grn}
                            currentUserId={currentUserId}
                            canApprove={isAM}
                            onRefresh={fetchDetails}
                            itemType="GRN"
                          />
                        </div>
                        
                        {grn.remarks && <p className="text-xs text-gray-400 italic">Remarks: {grn.remarks}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Purchase Invoices ─────────────────────────────────── */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Purchase Invoices ({piList.length})</h4>
                {piList.length === 0 ? (
                  <p className="text-sm text-gray-500">No PIs uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {piList.map((pi, idx) => (
                      <div key={pi.id || idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        {/* Row 1 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">PI Number</p>
                            {pi.fileUrl ? (
                              <a href={pi.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm font-medium">{pi.piNumber || "N/A"}</a>
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{pi.piNumber || "N/A"}</span>
                            )}
                          </div>
                          <InfoCell label="Payable Amount">₹{pi.payableAmount || "0"}</InfoCell>
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-2 gap-4">
                          <InfoCell label="Expected Date">{formatDate(pi.expectedPaymentDate)}</InfoCell>
                          <InfoCell label="Uploaded At">{formatDate(pi.createdAt)}</InfoCell>
                        </div>
                        {/* Row 3 — PM + FM */}
                        <div className="grid grid-cols-2 gap-4">
                          <BadgeCell label="PM Approval" status={pi.approvalStatus}
                            onClick={isPM ? () => handlePMApprovePI(pi) : undefined} />
                          <BadgeCell label="FM Approval" status={pi.financeManagerApproval}
                            onClick={isFM ? () => handleFMApprovePI(pi) : undefined} />
                        </div>
                        {/* Row 4 — PM + FM remarks */}
                        <div className="grid grid-cols-2 gap-4">
                          <InfoCell label="PM Remark">{pi.approvalRemarks}</InfoCell>
                          <InfoCell label="FM Remark">{pi.financeManagerApprovalRemarks}</InfoCell>
                        </div>
                        {/* Documents */}
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                          {pi.fileUrl && <a href={pi.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View PI Copy</a>}
                          {pi.poFileUrl && <a href={pi.poFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View PO Copy</a>}
                        </div>
                        <div className={`${pi.financeManagerApproval !== "APPROVED" ? "opacity-40 pointer-events-none" : ""}`}>
                          {pi.financeManagerApproval !== "APPROVED" && (
                            <p className="text-xs text-yellow-600 font-medium mb-1">⚠ Locked until FM approves</p>
                          )}
                          <AccountantSection
                            item={pi}
                            itemType="PI"
                            currentUserId={currentUserId}
                            canEdit={canEditAccountant}
                            onRefresh={fetchDetails}
                          />
                          <AMApprovalSection
                            item={pi}
                            currentUserId={currentUserId}
                            canApprove={isAM}
                            onRefresh={fetchDetails}
                            itemType="PI"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100">Close</button>
        </div>
      </div>

      {/* Global Approval Popup */}
      <ApprovalPopup
        isOpen={approvalPopup.open}
        onClose={closePopup}
        title={approvalPopup.title}
        currentStatus={approvalPopup.currentStatus}
        currentRemarks={approvalPopup.currentRemarks}
        infoMessage={approvalPopup.infoMessage}
        onSubmit={handlePopupSubmit}
        submitting={submitting}
      />
    </div>
  )
}

export default PODetailsModal