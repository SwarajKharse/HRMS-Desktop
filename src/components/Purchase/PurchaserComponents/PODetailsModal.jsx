"use client"

import { useState, useEffect } from "react"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"
import { grnService } from "../../../services/grnService"
import { financePayableService } from "../../../services/financePayableService"
import { paymentTransactionService } from "../../../services/paymentTransactionService"
import WeekdayDatePicker from "./WeekdayDatePicker"

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

const BadgeCell = ({ label, status, onClick, disabledTitle }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    {onClick ? (
      <button onClick={onClick} className="hover:opacity-75 transition-opacity">
        <StatusBadge status={status} />
      </button>
    ) : disabledTitle ? (
      <button disabled title={disabledTitle} className="opacity-50 cursor-not-allowed">
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

// ─── Edit PI Modal — replace an existing PENDING/REJECTED PI's file/details in place ──
function EditPIModal({ isOpen, onClose, pi, onSuccess, poAmountCap }) {
  const [piFile, setPIFile] = useState(null)
  const [payableAmount, setPayableAmount] = useState("")
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && pi) {
      setPIFile(null)
      setPayableAmount(pi.payableAmount || "")
      setExpectedPaymentDate(pi.expectedPaymentDate ? pi.expectedPaymentDate.split("T")[0] : "")
      setRemarks(pi.remarks || "")
      setError(null)
    }
  }, [isOpen, pi])

  if (!isOpen || !pi) return null

  const handleSave = async () => {
    if (!payableAmount || !expectedPaymentDate) {
      setError("Payable amount and expected payment date are required")
      return
    }
    try {
      setSaving(true)
      setError(null)
      const formData = new FormData()
      if (piFile) formData.append("file", piFile)
      formData.append("payableAmount", payableAmount)
      formData.append("expectedPaymentDate", expectedPaymentDate)
      formData.append("remarks", remarks)
      await purchaseInvoiceService.editPurchaseInvoice(pi.id, formData)
      onSuccess("PI updated successfully!")
      onClose()
    } catch (e) {
      console.error("Error editing PI:", e)
      setError(e?.response?.data?.message || "Failed to update PI. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Edit PI — {pi.piNumber}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">{error}</div>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Editing this PI will reset PM and FM approval — both will need to review it again.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace PI Document</label>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setPIFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
            {piFile && <p className="text-xs text-green-600 mt-1">✓ {piFile.name}</p>}
            <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current document.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payable Amount <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" max={poAmountCap || undefined} value={payableAmount} onChange={(e) => setPayableAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
            {poAmountCap ? <p className="text-xs text-gray-500 mt-1">Cannot exceed PO amount: ₹{Number(poAmountCap).toFixed(2)}</p> : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Payment Date <span className="text-red-500">*</span></label>
            <input type="date" value={expectedPaymentDate} onChange={(e) => setExpectedPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} disabled={saving} />
          </div>
        </div>
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm" disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit GRN Modal — replace an existing PENDING/REJECTED GRN's file/details in place ──
function EditGRNModal({ isOpen, onClose, grn, onSuccess, poAmountCap }) {
  const [files, setFiles] = useState({})
  const [payableAmount, setPayableAmount] = useState("")
  const [expectedPayableDate, setExpectedPayableDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && grn) {
      setFiles({})
      setPayableAmount(grn.payableAmount || "")
      setExpectedPayableDate(grn.expectedPayableDate ? grn.expectedPayableDate.split("T")[0] : "")
      setRemarks(grn.remarks || "")
      setError(null)
    }
  }, [isOpen, grn])

  if (!isOpen || !grn) return null

  const handleSave = async () => {
    if (!payableAmount || !expectedPayableDate) {
      setError("Payable amount and expected payable date are required")
      return
    }
    try {
      setSaving(true)
      setError(null)
      const formData = new FormData()
      if (files.grnCopyFile) formData.append("grnCopyFile", files.grnCopyFile)
      if (files.testCertificateFile) formData.append("testCertificateFile", files.testCertificateFile)
      if (files.invoiceCopyFile) formData.append("invoiceCopyFile", files.invoiceCopyFile)
      formData.append("payableAmount", payableAmount)
      formData.append("expectedPayableDate", expectedPayableDate)
      formData.append("remarks", remarks)
      await grnService.editGRN(grn.id, formData)
      onSuccess("GRN updated successfully!")
      onClose()
    } catch (e) {
      console.error("Error editing GRN:", e)
      setError(e?.response?.data?.message || "Failed to update GRN. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Edit GRN — {grn.grnNumber}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">{error}</div>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Editing this GRN will reset PM and FM approval — both will need to review it again.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace GRN Copy</label>
            <input type="file" onChange={(e) => setFiles((p) => ({ ...p, grnCopyFile: e.target.files?.[0] || null }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace Test Certificate</label>
            <input type="file" onChange={(e) => setFiles((p) => ({ ...p, testCertificateFile: e.target.files?.[0] || null }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace Invoice Copy</label>
            <input type="file" onChange={(e) => setFiles((p) => ({ ...p, invoiceCopyFile: e.target.files?.[0] || null }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
            <p className="text-xs text-gray-500 mt-1">Leave any file blank to keep the current document.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payable Amount <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" max={poAmountCap || undefined} value={payableAmount} onChange={(e) => setPayableAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
            {poAmountCap ? <p className="text-xs text-gray-500 mt-1">Cannot exceed remaining PO amount: ₹{Number(poAmountCap).toFixed(2)}</p> : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Payable Date <span className="text-red-500">*</span></label>
            <input type="date" value={expectedPayableDate} onChange={(e) => setExpectedPayableDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} disabled={saving} />
          </div>
        </div>
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm" disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Popup ──────────────────────────────────────────────────
function DeleteConfirmPopup({ isOpen, onClose, onConfirm, label, deleting }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Delete {label}?</h3>
          <p className="text-sm text-gray-600">This cannot be undone. Are you sure you want to delete {label}?</p>
        </div>
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm" disabled={deleting}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Accountant Section (Step 1 + Step 3) ────────────────────────────────────
function PaymentDetailsSection({ item, itemType, canEdit, onRefresh, currentUserId }) {
  const [paymentCycles, setPaymentCycles] = useState([])
  const [formData, setFormData] = useState({
    status: item.status || "",
    paymentCycle: item.paymentCycle || "",
    expectedPaymentDate: item.expectedPaymentDate || "",
    payableAmount: item.payableAmount || "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (canEdit) {
      purchaseInvoiceService.getPaymentCycles()
        .then(setPaymentCycles)
        .catch(() => setPaymentCycles([]))
    }
  }, [canEdit])

  const isRevision = formData.status === "Revision from Purchase"

  const handleSave = async () => {
    if (!formData.status) return
    if (!isRevision && (!formData.paymentCycle || !formData.expectedPaymentDate || !formData.payableAmount)) return
    try {
      setSaving(true)
      const payload = isRevision
        ? { status: formData.status }
        : {
            status: formData.status,
            payableAmount: String(formData.payableAmount),
            paymentCycle: formData.paymentCycle,
            expectedPaymentDate: formData.expectedPaymentDate,
          }
      if (itemType === "GRN") {
        await grnService.updateGRNForm(item.id, payload)
      } else {
        await purchaseInvoiceService.updatePurchaseInvoiceForm(item.id, payload)
      }
      // Also raise a Payment Transaction — the new AM→FM→Step3 calendar pipeline reads
      // from these instead of the old single-payment fields on the PI/GRN itself.
      if (!isRevision) {
        try {
          await paymentTransactionService.create({
            piId: itemType === "GRN" ? undefined : item.id,
            grnId: itemType === "GRN" ? item.id : undefined,
            requestedAmount: Number(formData.payableAmount),
            scheduledDate: formData.expectedPaymentDate,
            createdBy: currentUserId,
          })
        } catch (txnErr) {
          console.error("Error raising payment transaction:", txnErr)
        }
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
        (() => {
          const step1Submitted = Boolean(item.status && item.paymentCycle)
          const locked = step1Submitted && item.accountManagerApprovalStatus !== "REJECTED"
          return (
        <div className={locked ? "opacity-60 pointer-events-none" : ""}>
        <p className="text-xs font-medium text-gray-600">
          Payment Details
          {locked && <span className="ml-2 text-yellow-600 font-normal">(Locked — pending/approved by AM)</span>}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-1.5">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Status <span className="text-red-400">*</span></p>
            <select
              value={formData.status}
              onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
              disabled={locked}
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
                disabled={locked}
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
              <WeekdayDatePicker
                value={formData.expectedPaymentDate ? formData.expectedPaymentDate.split("T")[0] : ""}
                onChange={(iso) => setFormData((p) => ({ ...p, expectedPaymentDate: iso }))}
                allowedWeekday={formData.paymentCycle && formData.paymentCycle !== "Urgent" ? formData.paymentCycle : null}
                minDate={new Date().toISOString().split("T")[0]}
                disabled={locked}
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
                  disabled={locked}
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
            disabled={saving || !formData.status || locked}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Details"}
          </button>
        </div>
        </div>
          )
        })()
      )}
    </div>
  )
}

// ─── Payment Completion (Step 3 — locked until AM approves) ──────────────────
function PaymentCompletionSection({ item, itemType, canEdit, onRefresh }) {
  const [paymentDoneDate, setPaymentDoneDate] = useState(item.paymentDoneDate ? item.paymentDoneDate.split("T")[0] : "")
  const [receiptFile, setReceiptFile] = useState(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)

  if (!canEdit) return null

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

  const step2Done = item.accountManagerApprovalStatus === "APPROVED"
  return (
    <div className={`pt-3 border-t border-gray-100 space-y-3 ${!step2Done ? "opacity-40 pointer-events-none" : ""}`}>
      <p className="text-xs font-medium text-gray-600">
       Payment Completion
      {!step2Done && (
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
          disabled={!step2Done}
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
          disabled={!step2Done}
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
        disabled={submittingPayment || !paymentDoneDate || !step2Done}
        className="px-4 py-1.5 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 disabled:opacity-50"
      >
        {submittingPayment ? "Submitting..." : paymentSaved ? "✓ Submitted" : "Submit Payment"}
      </button>
    </div>
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

  const step1Done = Boolean(item.status && item.paymentCycle)

  return (
    <div className="pt-2 border-t border-gray-100 space-y-3">
      <p className="text-xs font-medium text-gray-600">AM Approval</p>
      {canApprove && !step1Done && (
        <p className="text-xs text-yellow-600 font-medium">Payment details (Step 1) required first</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <BadgeCell
          label="AM Approval"
          status={item.accountManagerApprovalStatus}
          onClick={canApprove && step1Done ? () => setShowPopup(true) : undefined}
        />
        <InfoCell label="AM Remark">{item.accountManagerApprovalRemarks}</InfoCell>
      </div>
      {canApprove && step1Done && (
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
  isPurchaser = false,
}) {
  const [piList, setPIList] = useState([])
  const [grnList, setGrnList] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingPI, setEditingPI] = useState(null)
  const [editingGRN, setEditingGRN] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: "PI"|"GRN", id, label }
  const [deleting, setDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      if (deleteTarget.type === "GRN") {
        await grnService.deleteGRN(deleteTarget.id)
      } else {
        await purchaseInvoiceService.deletePurchaseInvoice(deleteTarget.id)
      }
      setDeleteTarget(null)
      fetchDetails()
      if (onRefresh) onRefresh()
    } catch (e) {
      console.error("Error deleting:", e)
    } finally {
      setDeleting(false)
    }
  }

  // Section-level and per-item collapse state — everything starts collapsed
  // except the PO number/link, which is always visible.
  const [expandedSection, setExpandedSection] = useState({ poInfo: false, mtr: true, pi: false, grn: false })
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
    currentStatus: grn.financeManagerApprovalStatus || "PENDING",
    currentRemarks: grn.financeManagerApprovalRemarks || "",
    infoMessage: "This updates the FM approval on this GRN.",
    onSubmit: async (status, remarks) => {
      await financePayableService.approveOrRejectGRNPayable(grn.id, status, remarks, currentUserId)
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
      // A grouped PO row can span multiple underlying PurchaseOrder ids (one per MTR
      // line) — fetch PI/GRN across all of them, not just po.id, or items attached
      // to sibling lines get silently missed (they still show up in aggregate PO
      // Amount/Paid Amount totals computed elsewhere from allMTRData, so the two can
      // end up disagreeing if only po.id is queried here).
      const poIds = po.allMTRIds?.length ? po.allMTRIds : [po.id]
      const [pisByPO, grnsByPO] = await Promise.all([
        Promise.all(poIds.map((id) => purchaseInvoiceService.getPurchaseInvoicesByPO(id).catch(() => []))),
        Promise.all(poIds.map((id) => grnService.getGRNsByPO(id).catch(() => []))),
      ])
      setPIList(pisByPO.flat())
      setGrnList(grnsByPO.flat())
    } catch (e) {
      console.error("Error fetching PO details:", e)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !po?.id) return null

  // PO Amount vs Paid Amount — visible to every stakeholder on this shared page.
  const poLines = po.allMTRData?.length ? po.allMTRData : [po]
  const poBasicAmount = poLines.reduce((sum, p) => sum + (p.basicAmount || 0) + (p.miscellaneous || 0) - (p.discount || 0), 0)
  const poAmount = poLines.reduce((sum, p) => sum + (p.poAmount || 0), 0)
  const paidEntries = [
    ...piList.filter((pi) => pi.paymentStatus === "PAID").map((pi) => ({
      key: `pi-${pi.id}`, label: `PI ${pi.piNumber}`, amount: Number(pi.payableAmount) || 0,
      date: pi.paymentDoneDate, url: pi.paymentReceiptUrl,
    })),
    ...grnList.filter((g) => g.paymentStatus === "PAID").map((g) => ({
      key: `grn-${g.id}`, label: `GRN ${g.grnNumber}`, amount: Number(g.payableAmount) || 0,
      date: g.paymentDoneDate, url: g.paymentReceiptUrl,
    })),
  ]
  const paidAmount = paidEntries.reduce((sum, e) => sum + e.amount, 0)
  const balance = poAmount - paidAmount

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

          {(poAmount > 0 || paidAmount > 0) && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-indigo-600 font-medium">PO Basic Amount</p>
                  <p className="text-lg font-semibold text-indigo-900">₹{poBasicAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-medium">PO Total Amount</p>
                  <p className="text-lg font-semibold text-indigo-900">₹{poAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Paid Amount</p>
                  <p className="text-lg font-semibold text-green-700">₹{paidAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Balance</p>
                  <p className={`text-lg font-semibold ${balance > 0 ? "text-red-600" : "text-gray-700"}`}>₹{balance.toFixed(2)}</p>
                </div>
              </div>
              {paidEntries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-100 space-y-1">
                  <p className="text-xs font-medium text-indigo-700 mb-1">Payment Breakdown</p>
                  {paidEntries.map((e) => (
                    <div key={e.key} className="flex items-center justify-between text-xs text-gray-700">
                      <span>{e.label}{e.date ? ` — paid ${formatDate(e.date)}` : ""}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">₹{e.amount.toFixed(2)}</span>
                        {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Advice</a>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {poLines.some((p) => p.rateChanged) && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-800">⚠ Rate changed on {poLines.filter((p) => p.rateChanged).length} item{poLines.filter((p) => p.rateChanged).length !== 1 ? "s" : ""} from the approved comparison sheet — see the Purchase Order Snapshot below for details.</p>
            </div>
          )}

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
                <InfoCell label="PO Date">{formatDate(po.poDate)}</InfoCell>
                <InfoCell label="Vendor">{po.vendorName}</InfoCell>
                <InfoCell label="PO Status"><StatusBadge status={po.poStatus} /></InfoCell>
                <InfoCell label="Material Status"><StatusBadge status={po.materialStatus} /></InfoCell>
                <BadgeCell label="PM Approval" status={po.approvalStatus} />
                <BadgeCell label="FM Approval" status={po.financeManagerApprovalStatus} />
              </div>
            )}
          </div>

          {/* Purchase Order Snapshot — every item, its rate/GST/amount, and any rate-change
              remark, so PM/FM can review exactly what the purchaser entered before approving. */}
          {po.allMTRIds && po.allMTRIds.length > 0 && (
            <div>
              <button onClick={() => toggleSection("mtr")} className="w-full flex items-center gap-2 py-1">
                <span className="text-gray-500 text-sm">{expandedSection.mtr ? "▾" : "▸"}</span>
                <span className="font-semibold text-gray-800">Purchase Order Snapshot ({po.allMTRIds.length} item{po.allMTRIds.length !== 1 ? "s" : ""})</span>
              </button>
              {expandedSection.mtr && (
                <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["Project (Requisition No)", "Product (Item Code)", "Make", "UOM", "Qty", "Rate", "GST %", "Basic", "Total"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(po.allMTRData || [po]).map((entry, idx) => {
                        const requisitionNo = entry.requisitionNo || entry.boqMtr?.requisitionNo
                        const productCode = entry.productCode || entry.boqMtr?.productCode
                        const qty = entry.qty ?? entry.boqMtr?.purchaseMTR
                        const total = (entry.basicAmount || 0) + (entry.gstAmount || 0)
                        return (
                          <tr key={idx} className={entry.rateChanged ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {entry.projectName === "Project removed by finance" ? (
                                <span className="text-red-600 font-medium">{entry.projectName}</span>
                              ) : (
                                <>
                                  {entry.projectName || "N/A"}
                                  {requisitionNo ? <span className="text-gray-400"> ({requisitionNo})</span> : null}
                                </>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {entry.productName || "N/A"}
                              {productCode ? <span className="text-gray-400"> ({productCode})</span> : null}
                              {entry.rateChanged && (
                                <div className="mt-1 text-red-700">
                                  <span className="font-medium">⚠ Rate changed</span>
                                  {entry.comparisonApprovedRate != null && <span> (approved ₹{Number(entry.comparisonApprovedRate).toFixed(2)})</span>}
                                  {entry.rateChangeRemark && <p className="italic">"{entry.rateChangeRemark}"</p>}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">{entry.make || entry.boqMtr?.make || "N/A"}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">{entry.uom || entry.boqMtr?.uom || "N/A"}</td>
                            <td className="px-3 py-2 text-xs text-gray-600 font-medium">{qty ?? "N/A"}</td>
                            <td className="px-3 py-2 text-xs text-gray-600 font-medium">{entry.rate != null ? `₹${Number(entry.rate).toFixed(2)}` : "N/A"}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">{entry.gstPercent != null ? `${entry.gstPercent}%` : "N/A"}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">{entry.basicAmount != null ? `₹${Number(entry.basicAmount).toFixed(2)}` : "N/A"}</td>
                            <td className="px-3 py-2 text-xs font-semibold text-blue-700">{entry.basicAmount != null ? `₹${total.toFixed(2)}` : "N/A"}</td>
                          </tr>
                        )
                      })}
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
                                {isPurchaser && pi.approvalStatus !== "APPROVED" && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingPI(pi) }}
                                      title="Edit PI"
                                      className="text-gray-500 hover:text-blue-600 shrink-0"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "PI", id: pi.id, label: `PI ${pi.piNumber}` }) }}
                                      title="Delete PI"
                                      className="text-gray-500 hover:text-red-600 shrink-0"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </span>
                              {pi.paymentStatus === "PAID" ? (
                                <span className="flex items-center gap-3 shrink-0">
                                  <StatusBadge status="PAID" />
                                  {pi.paymentReceiptUrl && (
                                    <a href={pi.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-green-700 hover:text-green-900 text-xs underline">Payment Advice</a>
                                  )}
                                </span>
                              ) : (
                                <span className="flex items-center gap-2 text-xs shrink-0 flex-wrap justify-end">
                                  <span className="flex items-center gap-1"><span className="text-gray-500">PM:</span><StatusBadge status={pi.approvalStatus} /></span>
                                  <span className="flex items-center gap-1"><span className="text-gray-500">FM:</span><StatusBadge status={pi.financeManagerApproval} /></span>
                                  <span className="flex items-center gap-1"><span className="text-gray-500">Accountant:</span><StatusBadge status={pi.status || "PENDING"} /></span>
                                  <span className="flex items-center gap-1"><span className="text-gray-500">AM:</span><StatusBadge status={pi.accountManagerApprovalStatus} /></span>
                                </span>
                              )}
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
                                    onClick={isFM && pi.approvalStatus === "APPROVED" ? () => handleFMApprovePI(pi) : undefined}
                                    disabledTitle={isFM && pi.approvalStatus !== "APPROVED" ? "PM approval pending" : undefined} />
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
                                  <PaymentDetailsSection
                                    item={pi}
                                    itemType="PI"
                                    canEdit={canEditAccountant}
                                    onRefresh={fetchDetails}
                                    currentUserId={currentUserId}
                                  />
                                  <AMApprovalSection
                                    item={pi}
                                    currentUserId={currentUserId}
                                    canApprove={isAM}
                                    onRefresh={fetchDetails}
                                    itemType="PI"
                                  />
                                  <PaymentCompletionSection
                                    item={pi}
                                    itemType="PI"
                                    canEdit={canEditAccountant}
                                    onRefresh={fetchDetails}
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
                                {isPurchaser && grn.purchaseManagerApprovalStatus !== "APPROVED" && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingGRN(grn) }}
                                      title="Edit GRN"
                                      className="text-gray-500 hover:text-blue-600 shrink-0"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "GRN", id: grn.id, label: `GRN ${grn.grnNumber}` }) }}
                                      title="Delete GRN"
                                      className="text-gray-500 hover:text-red-600 shrink-0"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </span>
                              {grn.paymentStatus === "PAID" ? (
                                <span className="flex items-center gap-3 shrink-0">
                                  <StatusBadge status="PAID" />
                                  {grn.paymentReceiptUrl && (
                                    <a href={grn.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-green-700 hover:text-green-900 text-xs underline">Payment Advice</a>
                                  )}
                                </span>
                              ) : (
                                <span className="flex items-center gap-2 text-xs shrink-0 flex-wrap justify-end">
                                  {grn.invoiceCopyUrl && (
                                    <a href={grn.invoiceCopyUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:text-indigo-800 underline">Tax Invoice</a>
                                  )}
                                  <span className="flex items-center gap-1"><span className="text-gray-500">PM:</span><StatusBadge status={grn.purchaseManagerApprovalStatus} /></span>
                                  <span className="flex items-center gap-1"><span className="text-gray-500">FM:</span><StatusBadge status={grn.financeManagerApprovalStatus} /></span>
                                  <span className="flex items-center gap-1"><span className="text-gray-500">Accountant:</span><StatusBadge status={grn.status || "PENDING"} /></span>
                                  <span className="flex items-center gap-1"><span className="text-gray-500">AM:</span><StatusBadge status={grn.accountManagerApprovalStatus} /></span>
                                </span>
                              )}
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
                                  <BadgeCell label="FM Approval" status={grn.financeManagerApprovalStatus}
                                    onClick={isFM && grn.purchaseManagerApprovalStatus === "APPROVED" ? () => handleFMApproveGRN(grn) : undefined}
                                    disabledTitle={isFM && grn.purchaseManagerApprovalStatus !== "APPROVED" ? "PM approval pending" : undefined} />
                                </div>
                                {(grn.purchaseManagerApprovalRemarks || grn.financeManagerApprovalRemarks) && (
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    {grn.purchaseManagerApprovalRemarks && <span>PM Remark: {grn.purchaseManagerApprovalRemarks}</span>}
                                    {grn.financeManagerApprovalRemarks && <span>FM Remark: {grn.financeManagerApprovalRemarks}</span>}
                                  </div>
                                )}
                                <div className={`${(grn.purchaseManagerApprovalStatus !== "APPROVED" || grn.financeManagerApprovalStatus !== "APPROVED") ? "opacity-40 pointer-events-none" : ""}`}>
                                  {(grn.purchaseManagerApprovalStatus !== "APPROVED" || grn.financeManagerApprovalStatus !== "APPROVED") && (
                                    <p className="text-xs text-yellow-600 font-medium mb-1">⚠ Locked until PM and FM approve</p>
                                  )}
                                  <PaymentDetailsSection
                                    item={grn}
                                    itemType="GRN"
                                    canEdit={canEditAccountant}
                                    onRefresh={fetchDetails}
                                    currentUserId={currentUserId}
                                  />
                                  <AMApprovalSection
                                    item={grn}
                                    currentUserId={currentUserId}
                                    canApprove={isAM}
                                    onRefresh={fetchDetails}
                                    itemType="GRN"
                                  />
                                  <PaymentCompletionSection
                                    item={grn}
                                    itemType="GRN"
                                    canEdit={canEditAccountant}
                                    onRefresh={fetchDetails}
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

      <EditPIModal
        isOpen={editingPI !== null}
        onClose={() => setEditingPI(null)}
        pi={editingPI}
        onSuccess={() => fetchDetails()}
        poAmountCap={po.poAmount}
      />

      <EditGRNModal
        isOpen={editingGRN !== null}
        onClose={() => setEditingGRN(null)}
        grn={editingGRN}
        onSuccess={() => fetchDetails()}
        poAmountCap={po.poAmount}
      />

      <DeleteConfirmPopup
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        label={deleteTarget?.label || "this item"}
        deleting={deleting}
      />
    </div>
  )
}

export default PODetailsModal