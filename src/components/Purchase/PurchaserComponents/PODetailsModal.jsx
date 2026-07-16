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

      {/* Read-only for non-accountant — compact, info-dense form */}
      {!canEdit ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <span><span className="text-gray-500">Status:</span> <span className="font-medium text-gray-800">{item.status || "N/A"}</span></span>
          <span><span className="text-gray-500">Cycle:</span> <span className="font-medium text-gray-800">{item.paymentCycle || "N/A"}</span></span>
          <span><span className="text-gray-500">Expected:</span> <span className="font-medium text-gray-800">{formatDate(item.expectedPaymentDate)}</span></span>
          <span><span className="text-gray-500">Amount:</span> <span className="font-medium text-gray-800">₹{item.payableAmount || "0"}</span></span>
          <span className="flex items-center gap-1"><span className="text-gray-500">AM:</span> <StatusBadge status={item.accountManagerApprovalStatus} /></span>
          {item.accountManagerApprovalRemarks && <span className="text-gray-500 italic">"{item.accountManagerApprovalRemarks}"</span>}
          <span className="flex items-center gap-1"><span className="text-gray-500">Payment:</span> <StatusBadge status={item.paymentStatus} /></span>
          {item.paymentDoneDate && <span><span className="text-gray-500">Paid on:</span> <span className="font-medium text-gray-800">{formatDate(item.paymentDoneDate)}</span></span>}
          {item.paymentReceiptUrl && (
            <a href={item.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Payment Receipt</a>
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

  // Section-level and per-item collapse state — everything starts collapsed
  // except the PO number/link, which is always visible.
  const [expandedSection, setExpandedSection] = useState({ poInfo: false, mtr: false, pi: false, grn: false })
  const [expandedPI, setExpandedPI] = useState({})
  const [expandedGRN, setExpandedGRN] = useState({})
  const toggleSection = (key) => setExpandedSection((p) => ({ ...p, [key]: !p[key] }))
  const togglePI = (key) => setExpandedPI((p) => ({ ...p, [key]: !p[key] }))
  const toggleGRN = (key) => setExpandedGRN((p) => ({ ...p, [key]: !p[key] }))

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

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* PO Info — collapsed shows only PO number + link */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <button onClick={() => toggleSection("poInfo")} className="w-full flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold text-gray-800">
                <span className="text-gray-500 text-sm">{expandedSection.poInfo ? "▾" : "▸"}</span>
                PO Number: <span className="text-blue-700">{po.poNumber}</span>
              </span>
              {po.fileUrl && (
                <a href={po.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 text-xs underline shrink-0">View PO Document</a>
              )}
            </button>
            {expandedSection.poInfo && (
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                <InfoCell label="Created By">{po.uploadedByName}</InfoCell>
                <InfoCell label="Created Date">{formatDate(po.createdAt)}</InfoCell>
                <InfoCell label="Vendor">{po.vendorName}</InfoCell>
                <InfoCell label="PO Status"><StatusBadge status={po.poStatus} /></InfoCell>
                <InfoCell label="Material Status"><StatusBadge status={po.materialStatus} /></InfoCell>
                <BadgeCell label="PM Approval" status={po.approvalStatus} />
                <BadgeCell label="FM Approval" status={po.financeManagerApprovalStatus} />
              </div>
            )}
          </div>

          {/* MTR Details — collapsed by default */}
          {po.allMTRIds && po.allMTRIds.length > 0 && (
            <div>
              <button onClick={() => toggleSection("mtr")} className="w-full flex items-center gap-2 py-1">
                <span className="text-gray-500 text-sm">{expandedSection.mtr ? "▾" : "▸"}</span>
                <span className="font-semibold text-gray-800">MTR Details ({po.allMTRIds.length} items)</span>
              </button>
              {expandedSection.mtr && (
                <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
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
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {entry.projectName === "Project removed by finance" ? (
                              <span className="text-red-600 font-medium">{entry.projectName}</span>
                            ) : (
                              entry.projectName || "N/A"
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">{entry.productName || "N/A"}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 font-medium">{entry.boqMtr?.purchaseMTR || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
              {/* ── Vendors Proforma Invoice ───────────────────────────── */}
              <div>
                <button onClick={() => toggleSection("pi")} className="w-full flex items-center gap-2 py-1">
                  <span className="text-gray-500 text-sm">{expandedSection.pi ? "▾" : "▸"}</span>
                  <span className="font-semibold text-gray-800">Vendors Proforma Invoice ({piList.length})</span>
                </button>
                {expandedSection.pi && (
                  piList.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-2">No PIs uploaded yet</p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {piList.map((pi, idx) => {
                        const key = pi.id || idx
                        const open = !!expandedPI[key]
                        return (
                          <div key={key} className="border border-gray-200 rounded-lg p-3">
                            <button onClick={() => togglePI(key)} className="w-full flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-sm min-w-0">
                                <span className="text-gray-500 shrink-0">{open ? "▾" : "▸"}</span>
                                {pi.fileUrl ? (
                                  <a href={pi.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 underline font-medium truncate">{pi.piNumber || "N/A"}</a>
                                ) : (
                                  <span className="font-medium text-gray-900 truncate">{pi.piNumber || "N/A"}</span>
                                )}
                              </span>
                              <span className="flex items-center gap-3 shrink-0">
                                {pi.paymentReceiptUrl && (
                                  <a href={pi.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-green-700 hover:text-green-900 text-xs underline">Payment Receipt</a>
                                )}
                                <StatusBadge status={pi.paymentStatus || "PENDING"} />
                              </span>
                            </button>
                            {open && (
                              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                                {/* PI details — compact */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                  <span><span className="text-gray-500">Payable:</span> <span className="font-medium text-gray-800">₹{pi.payableAmount || "0"}</span></span>
                                  <span><span className="text-gray-500">Expected:</span> <span className="font-medium text-gray-800">{formatDate(pi.expectedPaymentDate)}</span></span>
                                  <span><span className="text-gray-500">Uploaded:</span> <span className="font-medium text-gray-800">{formatDate(pi.createdAt)}</span></span>
                                  {pi.poFileUrl && <a href={pi.poFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">View PO Copy</a>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <BadgeCell label="PM Approval" status={pi.approvalStatus}
                                    onClick={isPM ? () => handlePMApprovePI(pi) : undefined} />
                                  <BadgeCell label="FM Approval" status={pi.financeManagerApproval}
                                    onClick={isFM ? () => handleFMApprovePI(pi) : undefined} />
                                </div>
                                {(pi.approvalRemarks || pi.financeManagerApprovalRemarks) && (
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    {pi.approvalRemarks && <span>PM Remark: {pi.approvalRemarks}</span>}
                                    {pi.financeManagerApprovalRemarks && <span>FM Remark: {pi.financeManagerApprovalRemarks}</span>}
                                  </div>
                                )}
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
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>

              {/* ── GRN / Vendors Tax Invoice ──────────────────────────── */}
              <div>
                <button onClick={() => toggleSection("grn")} className="w-full flex items-center gap-2 py-1">
                  <span className="text-gray-500 text-sm">{expandedSection.grn ? "▾" : "▸"}</span>
                  <span className="font-semibold text-gray-800">GRN/Vendors Tax Invoice ({grnList.length})</span>
                </button>
                {expandedSection.grn && (
                  grnList.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-2">No GRNs uploaded yet</p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {grnList.map((grn, idx) => {
                        const key = grn.id || idx
                        const open = !!expandedGRN[key]
                        return (
                          <div key={key} className="border border-gray-200 rounded-lg p-3">
                            <button onClick={() => toggleGRN(key)} className="w-full flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-sm min-w-0">
                                <span className="text-gray-500 shrink-0">{open ? "▾" : "▸"}</span>
                                {grn.grnCopyUrl ? (
                                  <a href={grn.grnCopyUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 underline font-medium truncate">{grn.grnNumber || "N/A"}</a>
                                ) : (
                                  <span className="font-medium text-gray-900 truncate">{grn.grnNumber || "N/A"}</span>
                                )}
                              </span>
                              <span className="flex items-center gap-3 shrink-0">
                                {grn.invoiceCopyUrl && (
                                  <a href={grn.invoiceCopyUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:text-indigo-800 text-xs underline">Tax Invoice</a>
                                )}
                                {grn.paymentReceiptUrl && (
                                  <a href={grn.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-green-700 hover:text-green-900 text-xs underline">Payment Receipt</a>
                                )}
                                <StatusBadge status={grn.paymentStatus || "PENDING"} />
                              </span>
                            </button>
                            {open && (
                              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                                {/* GRN details — compact */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                  <span><span className="text-gray-500">Payable:</span> <span className="font-medium text-gray-800">₹{grn.payableAmount || "0"}</span></span>
                                  <span><span className="text-gray-500">Expected:</span> <span className="font-medium text-gray-800">{formatDate(grn.expectedPayableDate)}</span></span>
                                  <span><span className="text-gray-500">Uploaded:</span> <span className="font-medium text-gray-800">{formatDate(grn.createdAt)}</span></span>
                                  {grn.testCertificateUrl && <a href={grn.testCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Test Certificate</a>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <BadgeCell label="PM Approval" status={grn.purchaseManagerApprovalStatus}
                                    onClick={isPM ? () => handlePMApproveGRN(grn) : undefined} />
                                  <BadgeCell label="FM Approval" status={grn.purchaseOrder?.financeManagerApprovalStatus}
                                    onClick={isFM ? () => handleFMApproveGRN(grn) : undefined} />
                                </div>
                                {(grn.purchaseManagerApprovalRemarks || grn.purchaseOrder?.financeManagerApprovalRemarks) && (
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    {grn.purchaseManagerApprovalRemarks && <span>PM Remark: {grn.purchaseManagerApprovalRemarks}</span>}
                                    {grn.purchaseOrder?.financeManagerApprovalRemarks && <span>FM Remark: {grn.purchaseOrder.financeManagerApprovalRemarks}</span>}
                                  </div>
                                )}
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
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
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