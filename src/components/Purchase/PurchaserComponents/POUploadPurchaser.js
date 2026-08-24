"use client"

import { useState, useEffect, useCallback } from "react"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { purchaseOrderService } from "../../../services/purchaseOrderService"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"
import { grnService } from "../../../services/grnService"
import { useAuth } from "../../../contexts/AuthContext"
import { getErrorMessage } from "../../../utils/errorUtils"
import VendorDropdownPOUpload from "./VendorDropdownPOUpload"
import PODetailsModal from "./PODetailsModal"
import { PaymentStatusCell } from "./AmountBreakdownCell"

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

// ─── PI Upload Modal ─────────────────────────────────────────────────────────
export function PIUploadModal({ isOpen, onClose, po, onSuccess }) {
  const { user } = useAuth()
  const [piFile, setPIFile] = useState(null)
  const [payableAmount, setPayableAmount] = useState("")
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setPIFile(null)
    setPayableAmount("")
    setExpectedPaymentDate("")
    setRemarks("")
    setError(null)
  }

  const handleSubmit = async () => {
    if (!piFile || !payableAmount || !expectedPaymentDate) {
      setError("Please fill in all required fields")
      return
    }
    try {
      setUploading(true)
      setError(null)
      const projectName = po.projectNames?.length > 0 ? po.projectNames.join(", ") : (po.projectName || "")
      const formData = new FormData()
      formData.append("file", piFile)
      formData.append("payableAmount", payableAmount)
      formData.append("projectName", projectName)
      formData.append("expectedPaymentDate", expectedPaymentDate)
      formData.append("remarks", remarks)
      formData.append("poId", po.id)
      formData.append("uploadedBy", user?.userId || user?.id || 1)
      await purchaseInvoiceService.uploadPurchaseInvoice(formData)
      onSuccess("PI uploaded successfully!")
      onClose()
    } catch (e) {
      console.error("Error uploading PI:", e)
      setError(getErrorMessage(e, "Failed to upload PI. Please try again."))
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen || !po) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">Upload Proforma Invoice</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">{error}</div>
          )}

          {/* PO Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Purchase Order Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-blue-600 font-medium">PO Number:</span> <span className="text-blue-900">{po.poNumber}</span></div>
              <div><span className="text-blue-600 font-medium">Uploaded Date:</span> <span className="text-blue-900">{formatDate(po.createdAt)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PI Document <span className="text-red-500">*</span></label>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setPIFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading} />
            {piFile && <p className="text-xs text-green-600 mt-1">✓ {piFile.name}</p>}
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payable Amount <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" max={po.poAmount || undefined} value={payableAmount} onChange={(e) => setPayableAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="0.00" disabled={uploading} />
              {po.poAmount ? <p className="text-xs text-gray-500 mt-1">Cannot exceed PO amount: ₹{Number(po.poAmount).toFixed(2)}</p> : null}
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Payment Date <span className="text-red-500">*</span></label>
            <input type="date" value={expectedPaymentDate} onChange={(e) => setExpectedPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} placeholder="Add any additional remarks..." disabled={uploading} />
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm" disabled={uploading}>Cancel</button>
          <button onClick={handleSubmit} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">
            {uploading ? "Uploading..." : "Submit PI"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── GRN Upload Modal ────────────────────────────────────────────────────────
export function GRNUploadModal({ isOpen, onClose, po, onSuccess }) {
  const { user } = useAuth()
  const [grnCopyFile, setGrnCopyFile] = useState(null)
  const [testCertificateFile, setTestCertificateFile] = useState(null)
  const [invoiceCopyFile, setInvoiceCopyFile] = useState(null)
  const [payableAmount, setPayableAmount] = useState("")
  const [expectedPayableDate, setExpectedPayableDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [latestPI, setLatestPI] = useState(null)
  const [amountCap, setAmountCap] = useState(null)

  useEffect(() => {
    if (isOpen && po?.id) {
      fetchLatestPI()
      resetForm()
      grnService.getAmountCap(po.id)
        .then((cap) => { setAmountCap(cap); setPayableAmount(cap ? String(cap) : "") })
        .catch(() => setAmountCap(null))
    }
  }, [isOpen, po])

  const fetchLatestPI = async () => {
    try {
      const piList = await purchaseInvoiceService.getPurchaseInvoicesByPO(po.id)
      if (piList && piList.length > 0) setLatestPI(piList[piList.length - 1])
    } catch (e) {
      console.error("Error fetching latest PI:", e)
    }
  }

  const resetForm = () => {
    setGrnCopyFile(null)
    setTestCertificateFile(null)
    setInvoiceCopyFile(null)
    setPayableAmount("")
    setExpectedPayableDate("")
    setRemarks("")
    setError(null)
    setAmountCap(null)
  }

  const handleSubmit = async () => {
    if (!grnCopyFile || !payableAmount || !expectedPayableDate) {
      setError("Please fill in all required fields")
      return
    }
    try {
      setUploading(true)
      setError(null)
      const formData = new FormData()
      formData.append("poId", po.id)
      formData.append("grnCopyFile", grnCopyFile)
      if (testCertificateFile) formData.append("testCertificateFile", testCertificateFile)
      if (invoiceCopyFile) formData.append("invoiceCopyFile", invoiceCopyFile)
      formData.append("payableAmount", payableAmount)
      formData.append("expectedPayableDate", expectedPayableDate)
      formData.append("uploadedBy", user?.userId || user?.id || 1)
      if (remarks) formData.append("remarks", remarks)
      await grnService.uploadGRN(formData)
      onSuccess("GRN uploaded successfully!")
      onClose()
    } catch (e) {
      console.error("Error uploading GRN:", e)
      setError(getErrorMessage(e, "Failed to upload GRN. Please try again."))
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen || !po) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">Upload GRN (Goods Received Note)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">{error}</div>
          )}

          {/* PI Info */}
          {latestPI && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Proforma Invoice Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-blue-600 font-medium">PI Number:</span> <span className="text-blue-900">{latestPI.piNumber || "N/A"}</span></div>
                <div><span className="text-blue-600 font-medium">PO Number:</span> <span className="text-blue-900">{po.poNumber}</span></div>
                <div><span className="text-blue-600 font-medium">Project Name:</span> <span className="text-blue-900">{latestPI.projectName || "N/A"}</span></div>
                <div><span className="text-blue-600 font-medium">PI Amount:</span> <span className="text-blue-900">₹{latestPI.payableAmount || "0"}</span></div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GRN Copy <span className="text-red-500">*</span></label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setGrnCopyFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading} />
            {grnCopyFile && <p className="text-xs text-green-600 mt-1">✓ {grnCopyFile.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Certificate</label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setTestCertificateFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading} />
            {testCertificateFile && <p className="text-xs text-green-600 mt-1">✓ {testCertificateFile.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Copy</label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setInvoiceCopyFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading} />
            {invoiceCopyFile && <p className="text-xs text-green-600 mt-1">✓ {invoiceCopyFile.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payable Amount <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" max={amountCap || undefined} value={payableAmount} onChange={(e) => setPayableAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="0.00" disabled={uploading} />
            {amountCap !== null && <p className="text-xs text-gray-500 mt-1">Prefilled with the remaining PO amount (₹{Number(amountCap).toFixed(2)}) — editable up to this cap.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Payable Date <span className="text-red-500">*</span></label>
            <input type="date" value={expectedPayableDate} onChange={(e) => setExpectedPayableDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} placeholder="Add any additional remarks about the GRN..." disabled={uploading} />
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm" disabled={uploading}>Cancel</button>
          <button onClick={handleSubmit} disabled={uploading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50">
            {uploading ? "Uploading..." : "Upload GRN"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit PO Modal — the exact Upload PO page, prefilled with this PO's vendor/items and
// wired to save back into it (add/remove/edit items, qty flows back into "remaining" for
// other POs) instead of creating a new one ────────────────────────────────────────────
export function EditPOModal({ isOpen, onClose, po, onSuccess, user }) {
  return <UploadPOModal isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} user={user} editPo={po} />
}

// ─── Upload PO Modal (3-step, unchanged logic) ───────────────────────────────
export function UploadPOModal({ isOpen, onClose, onSuccess, user, editPo }) {
  const isEdit = Boolean(editPo)
  const [selectedVendor, setSelectedVendor] = useState("")
  const [mtrs, setMtrs] = useState([])
  const [selectedLines, setSelectedLines] = useState({}) // { [mtrId]: { mtr, qty, rate, gstPercent, rateRemark, poId } }
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [poFile, setPOFile] = useState(null)
  const [poNumber, setPONumber] = useState("")
  const [poDate, setPODate] = useState("")
  const [message, setMessage] = useState({ type: "", text: "" })

  // Miscellaneous/discount apply once to the whole PO (not per item) — each has its own
  // GST% since they're independent (e.g. one may be taxable and the other not).
  const [poMisc, setPOMisc] = useState("0")
  const [poMiscGstPercent, setPOMiscGstPercent] = useState("18")
  const [poDiscount, setPODiscount] = useState("0")
  const [poDiscountGstPercent, setPODiscountGstPercent] = useState("18")

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 5000)
  }

  const reset = () => {
    setSelectedVendor("")
    setMtrs([])
    setSelectedLines({})
    setPOFile(null)
    setPONumber("")
    setPODate("")
    setPOMisc("0")
    setPOMiscGstPercent("18")
    setPODiscount("0")
    setPODiscountGstPercent("18")
    setMessage({ type: "", text: "" })
  }

  const handleClose = () => { reset(); onClose() }

  // Editing: prefill PO number/date/misc/discount, and select the vendor so its items load.
  useEffect(() => {
    if (isOpen && editPo) {
      const rows = editPo.allMTRData?.length ? editPo.allMTRData : [editPo]
      const primary = rows[0] || {}
      setPONumber(editPo.poNumber || "")
      setPODate(editPo.poDate ? String(editPo.poDate).split("T")[0] : "")
      setPOMisc(primary.miscellaneous != null ? String(primary.miscellaneous) : "0")
      setPOMiscGstPercent(primary.miscGstPercent != null ? String(primary.miscGstPercent) : "18")
      setPODiscount(primary.discount != null ? String(primary.discount) : "0")
      setPODiscountGstPercent(primary.discountGstPercent != null ? String(primary.discountGstPercent) : "18")
      setSelectedVendor(editPo.vendorName || primary.vendorName || "")
    } else if (isOpen && !editPo) {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editPo])

  const fetchMTRs = useCallback(async (vendorName) => {
    setLoading(true)
    if (!isEdit) setSelectedLines({})
    try {
      const data = await comparisonSheetService.getMTRsByApprovedVendor({
        vendorName, assignedPurchaser: user?.userId || 1, excludePoNumber: editPo?.poNumber,
      })
      setMtrs(data || [])
    } catch (e) {
      console.error("Error fetching MTRs:", e)
      setMtrs([])
    } finally {
      setLoading(false)
    }
  }, [user?.userId, isEdit, editPo?.poNumber])

  useEffect(() => {
    if (selectedVendor) fetchMTRs(selectedVendor)
  }, [selectedVendor, fetchMTRs])

  // Once this PO's own items are in the fetched list (their qty added back via
  // excludePoNumber), pre-check them with their existing qty/rate/GST/remark.
  useEffect(() => {
    if (!isEdit || !editPo || mtrs.length === 0) return
    const rows = editPo.allMTRData?.length ? editPo.allMTRData : [editPo]
    setSelectedLines((prev) => {
      if (Object.keys(prev).length > 0) return prev // already seeded
      const next = {}
      rows.forEach((row) => {
        const targetId = row.boqMtr?.id || row.boqCategoryMtr?.id
        const mtr = mtrs.find((m) => m.id === targetId)
        if (!mtr) return
        next[mtr.id] = {
          mtr,
          qty: row.qty != null ? String(row.qty) : String(mtr.remainingPoQty ?? 0),
          rate: row.rate != null ? String(row.rate) : "",
          gstPercent: row.gstPercent != null ? String(row.gstPercent) : "18",
          rateRemark: row.rateChangeRemark || "",
          poId: row.id,
        }
      })
      return next
    })
  }, [isEdit, editPo, mtrs])

  const remainingFor = (mtr) => mtr.remainingPoQty ?? mtr.purchaseMTR ?? 0

  const toggleLine = (mtr) => {
    setSelectedLines((prev) => {
      const next = { ...prev }
      if (next[mtr.id]) {
        delete next[mtr.id]
      } else {
        next[mtr.id] = {
          mtr,
          qty: String(remainingFor(mtr)),
          rate: mtr.approvedRate !== null && mtr.approvedRate !== undefined ? String(mtr.approvedRate) : "",
          gstPercent: "18",
          rateRemark: "",
        }
      }
      return next
    })
  }

  const updateQty = (mtrId, value) => {
    setSelectedLines((prev) => {
      if (!prev[mtrId]) return prev
      let v = value
      const remaining = remainingFor(prev[mtrId].mtr)
      const n = Number.parseFloat(value)
      if (!Number.isNaN(n) && n > remaining) v = String(remaining)
      if (!Number.isNaN(n) && n < 0) v = "0"
      return { ...prev, [mtrId]: { ...prev[mtrId], qty: v } }
    })
  }

  const updateLineAmountField = (mtrId, field, value) => {
    setSelectedLines((prev) => (prev[mtrId] ? { ...prev, [mtrId]: { ...prev[mtrId], [field]: value } } : prev))
  }

  const lineAmounts = (line) => {
    const qty = Number.parseFloat(line.qty) || 0
    const rate = Number.parseFloat(line.rate) || 0
    const gstPercent = Number.parseFloat(line.gstPercent) || 0
    const basic = qty * rate
    const gst = basic * (gstPercent / 100)
    return { basic, gst, total: basic + gst }
  }

  const selectedCount = Object.keys(selectedLines).length
  const allValid = selectedCount > 0 && Object.values(selectedLines).every((s) => {
    const n = Number.parseFloat(s.qty)
    if (Number.isNaN(n) || n <= 0 || n > remainingFor(s.mtr)) return false
    const approvedRate = s.mtr.approvedRate !== null && s.mtr.approvedRate !== undefined ? Number(s.mtr.approvedRate) : null
    const currentRate = Number.parseFloat(s.rate)
    const rateChanged = approvedRate !== null && !Number.isNaN(currentRate) && Math.abs(currentRate - approvedRate) > 0.01
    if (rateChanged && !(s.rateRemark || "").trim()) return false
    return true
  })

  const itemsBasicTotal = Object.values(selectedLines).reduce((sum, l) => sum + lineAmounts(l).basic, 0)
  const itemsGstTotal = Object.values(selectedLines).reduce((sum, l) => sum + lineAmounts(l).gst, 0)
  const miscVal = Number.parseFloat(poMisc) || 0
  const miscGstPct = Number.parseFloat(poMiscGstPercent) || 0
  const discountVal = Number.parseFloat(poDiscount) || 0
  const discountGstPct = Number.parseFloat(poDiscountGstPercent) || 0
  const miscGst = miscVal * (miscGstPct / 100)
  const discountGst = discountVal * (discountGstPct / 100)
  const poBasicAmountTotal = itemsBasicTotal + miscVal - discountVal
  const poTotalAmountTotal = poBasicAmountTotal + itemsGstTotal + miscGst - discountGst

  const handleUpload = async () => {
    if ((!isEdit && !poFile) || selectedCount === 0 || !poNumber.trim() || !poDate) {
      showMessage("error", "Please enter PO Number, PO Date, select a file and at least one item")
      return
    }
    if (!allValid) {
      showMessage("error", "Please enter a valid quantity (between 1 and the remaining quantity) for every selected item, and a remark for any changed rate")
      return
    }
    try {
      setUploading(true)
      const formData = new FormData()
      if (poFile) formData.append("file", poFile)
      Object.values(selectedLines).forEach(({ mtr, qty, rate, gstPercent, rateRemark, poId }) => {
        formData.append("mtrIds", mtr.id)
        const itemKind = (mtr.type || "").toUpperCase() === "BILLABLE" ? "BILLABLE" : "CATEGORY"
        formData.append("itemKinds", itemKind)
        formData.append("qtys", qty)
        formData.append("rates", rate || "0")
        formData.append("gstPercents", gstPercent || "18")
        formData.append("rateRemarks", rateRemark || "")
        if (isEdit) formData.append("poIds", poId || "")
      })
      formData.append("poNumber", poNumber.trim())
      formData.append("poDate", poDate)
      formData.append("miscellaneous", poMisc || "0")
      formData.append("miscGstPercent", poMiscGstPercent || "18")
      formData.append("discount", poDiscount || "0")
      formData.append("discountGstPercent", poDiscountGstPercent || "18")
      formData.append("currentUserId", user?.userId || 1)
      if (isEdit) {
        formData.append("originalPoNumber", editPo.poNumber)
        await purchaseOrderService.editPurchaseOrder(formData)
        showMessage("success", "PO updated successfully!")
        setTimeout(() => { handleClose(); onSuccess("PO updated successfully!") }, 1500)
      } else {
        formData.append("vendorName", selectedVendor)
        formData.append("uploadedBy", user?.userId || 1)
        await comparisonSheetService.uploadPOForMTRs(formData)
        showMessage("success", "PO uploaded successfully!")
        setTimeout(() => { handleClose(); onSuccess("PO uploaded successfully!") }, 1500)
      }
    } catch (e) {
      console.error("Error saving PO:", e)
      showMessage("error", getErrorMessage(e, "Error saving PO. Please try again."))
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col" style={{ height: "90vh" }}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{isEdit ? `Edit Purchase Order — ${editPo.poNumber}` : "Upload Purchase Order"}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message.text && (
          <div className={`mx-6 mt-4 p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Editing this PO will reset PM and FM approval — both will need to review it again. Removing an item frees its quantity back for other POs immediately.
            </div>
          )}
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendor</label>
            <VendorDropdownPOUpload value={selectedVendor} onChange={(v) => setSelectedVendor(v)} placeholder="Search and select vendor..." disabled={isEdit} />
          </div>

          {selectedVendor && (
            loading ? (
              <div className="text-center py-8 text-gray-500">Loading approved items...</div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Items</h3>
                  {mtrs.length === 0 ? (
                    <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-6 text-center">
                      No PM-approved items pending a PO for this vendor.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-md divide-y max-h-72 overflow-y-auto">
                      {mtrs.map((mtr) => {
                        const remaining = remainingFor(mtr)
                        const line = selectedLines[mtr.id]
                        const checked = !!line
                        const amounts = checked ? lineAmounts(line) : null
                        return (
                          <div key={mtr.id} className="px-3 py-2 text-sm hover:bg-gray-50">
                            <div className="flex items-center justify-between gap-3">
                              <label className="flex items-center gap-2 flex-1 min-w-0">
                                <input type="checkbox" checked={checked} onChange={() => toggleLine(mtr)} className="h-4 w-4 shrink-0" />
                                <span className="truncate" title={mtr.projectName}>{mtr.projectName || "N/A"}</span>
                                <span className="text-gray-400">—</span>
                                <span className="truncate" title={mtr.productName}>{mtr.productName || "N/A"}</span>
                              </label>
                              <span className="flex items-center gap-3 shrink-0">
                                <span className="text-gray-500 text-xs">Remaining: {remaining}</span>
                                {checked && (
                                  <input
                                    type="number" min="0" max={remaining} step="any" placeholder="Qty"
                                    value={line.qty}
                                    onChange={(e) => updateQty(mtr.id, e.target.value)}
                                    className="w-20 h-8 rounded border border-blue-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                )}
                                {checked && (
                                  <button
                                    type="button"
                                    onClick={() => toggleLine(mtr)}
                                    title="Remove from this PO"
                                    className="text-gray-400 hover:text-red-600 shrink-0"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            </div>
                            {checked && (() => {
                              const approvedRate = mtr.approvedRate !== null && mtr.approvedRate !== undefined ? Number(mtr.approvedRate) : null
                              const currentRate = Number.parseFloat(line.rate)
                              const rateChanged = approvedRate !== null && !Number.isNaN(currentRate) && Math.abs(currentRate - approvedRate) > 0.01
                              return (
                              <div className="mt-2 flex flex-wrap items-end gap-3 pl-6">
                                <div className="flex flex-col gap-0.5">
                                  <label className="text-xs text-gray-500">Rate {approvedRate !== null && <span className="text-gray-400">(approved: {approvedRate.toFixed(2)})</span>}</label>
                                  <input
                                    type="number" step="0.01" placeholder="Rate"
                                    value={line.rate}
                                    onChange={(e) => updateLineAmountField(mtr.id, "rate", e.target.value)}
                                    className={`w-24 h-8 rounded border px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${rateChanged ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                                  />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <label className="text-xs text-gray-500">GST %</label>
                                  <input
                                    type="number" step="0.01" placeholder="18"
                                    value={line.gstPercent}
                                    onChange={(e) => updateLineAmountField(mtr.id, "gstPercent", e.target.value)}
                                    className="w-16 h-8 rounded border border-gray-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="text-xs text-gray-600 pb-1.5">
                                  Basic: <span className="font-medium">{amounts.basic.toFixed(2)}</span> + GST: <span className="font-medium">{amounts.gst.toFixed(2)}</span> ={" "}
                                  <span className="font-semibold text-blue-700">{amounts.total.toFixed(2)}</span>
                                </div>
                                {rateChanged && (
                                  <div className="flex flex-col gap-0.5 w-full">
                                    <label className="text-xs text-red-600 font-medium">Rate differs from approved comparison rate — remark required (shown to PM/FM)</label>
                                    <input
                                      type="text" placeholder="Why is the rate different?"
                                      value={line.rateRemark || ""}
                                      onChange={(e) => updateLineAmountField(mtr.id, "rateRemark", e.target.value)}
                                      className="w-full h-8 rounded border border-red-400 bg-red-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                    />
                                  </div>
                                )}
                              </div>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {selectedCount > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                      <h4 className="text-xs font-semibold text-gray-700">PO-level Adjustments</h4>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-gray-500">Miscellaneous (+)</label>
                          <input
                            type="number" step="0.01" placeholder="0"
                            value={poMisc}
                            onChange={(e) => setPOMisc(e.target.value)}
                            className="w-24 h-8 rounded border border-gray-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-gray-500">Misc. GST %</label>
                          <input
                            type="number" step="0.01" placeholder="18"
                            value={poMiscGstPercent}
                            onChange={(e) => setPOMiscGstPercent(e.target.value)}
                            className="w-20 h-8 rounded border border-gray-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-gray-500">Discount (−)</label>
                          <input
                            type="number" step="0.01" placeholder="0"
                            value={poDiscount}
                            onChange={(e) => setPODiscount(e.target.value)}
                            className="w-24 h-8 rounded border border-gray-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-gray-500">Discount GST %</label>
                          <input
                            type="number" step="0.01" placeholder="18"
                            value={poDiscountGstPercent}
                            onChange={(e) => setPODiscountGstPercent(e.target.value)}
                            className="w-20 h-8 rounded border border-gray-300 px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200 flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm">
                        <span className="text-gray-700">PO Basic Amount: <span className="font-semibold">₹{poBasicAmountTotal.toFixed(2)}</span></span>
                        <span className="text-blue-800">PO Total Amount: <span className="font-semibold">₹{poTotalAmountTotal.toFixed(2)}</span></span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedCount > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-blue-800">PO Number <span className="text-red-500">*</span></label>
                        <input type="text" value={poNumber} onChange={(e) => setPONumber(e.target.value)} placeholder="Enter Purchase Order Number"
                          className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-blue-800">PO Date <span className="text-red-500">*</span></label>
                        <input type="date" value={poDate} onChange={(e) => setPODate(e.target.value)}
                          className="h-10 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs font-medium text-blue-800">
                          {isEdit ? "Replace PO File" : "Upload Purchase Order File"} {!isEdit && <span className="text-red-500">*</span>}
                        </label>
                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setPOFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {poFile ? <p className="text-xs text-green-600">Selected: {poFile.name}</p> : isEdit && <p className="text-xs text-gray-500">Leave blank to keep the current document.</p>}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handleUpload} disabled={uploading || !allValid || (!isEdit && !poFile) || !poNumber.trim() || !poDate}
                        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploading ? "Saving..." : isEdit ? `Save PO (${selectedCount} item${selectedCount !== 1 ? "s" : ""})` : `Upload PO (${selectedCount} item${selectedCount !== 1 ? "s" : ""})`}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const POUploadPurchaser = () => {
  const { user } = useAuth()

  const [pos, setPOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)
  const [successMessage, setSuccessMessage] = useState(null)
  const [expandedPOHistory, setExpandedPOHistory] = useState({})

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
      // Fetch all records (large size) so we can group properly on frontend
      const data = await purchaseOrderService.getPurchaseOrdersPaginated({
        page: 0,
        size: 100,
        assignedPurchaser: user?.userId || 1,
      })

      const rawList = data.content || data || []

      // Group by poNumber — 1 PO number = 1 row
      // Use a Map to keep insertion order and merge duplicate poNumbers
      const poMap = new Map()

      rawList.forEach((po) => {
          const key = po.poNumber

          const mtrCode = po.boqMtr?.mtrCode || ""
          const actualProject = po.projectName || po.boqMtr?.projectName || null

          const poBasicContribution = (po.basicAmount || 0) + (po.miscellaneous || 0) - (po.discount || 0)

          if (!poMap.has(key)) {
            poMap.set(key, {
              ...po,
              // Use the highest id entry as the "latest" PO for this poNumber
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
            // Keep the entry with the highest id (latest)
            const latest = po.id > existing.id ? po : existing
            // Merge project names — avoid duplicates
            const mergedProjects = [...new Set([
              ...existing.projectNames,
              ...(actualProject ? [actualProject] : []),
            ])]
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

      const grouped = Array.from(poMap.values())
      // Sort by latest createdAt descending
      grouped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      // Apply frontend pagination
      const start = currentPage * pageSize
      const paginated = grouped.slice(start, start + pageSize)

      setPOs(paginated)
      setTotalPages(Math.ceil(grouped.length / pageSize) || 1)
    } catch (e) {
      console.error("Error fetching POs:", e)
      setPOs([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, user?.userId])

  useEffect(() => {
    fetchPOs()
  }, [fetchPOs])

  // Apply filters on the fetched grouped POs
  const filteredPOs = pos.filter((po) => {
    const matchPO = !filterPONumber || po.poNumber?.toLowerCase().includes(filterPONumber.toLowerCase())
    const matchVendor = !filterVendor || (po.vendorName || po.uploadedBy?.firstName || "").toLowerCase().includes(filterVendor.toLowerCase())
    const matchProject = !filterProjectName || po.projectNames?.some((p) => p.toLowerCase().includes(filterProjectName.toLowerCase()))
    const pmStatus = po.approvalStatus || "PENDING"
    const fmStatus = po.financeManagerApprovalStatus || "PENDING"
    const matchPM = !filterPMApproval || pmStatus === filterPMApproval
    const matchFM = !filterFMApproval || fmStatus === filterFMApproval
    const matchPOStatus = !filterPOStatus || (po.poStatus || "OPEN") === filterPOStatus
    const matchMaterialStatus = !filterMaterialStatus || (po.materialStatus || "MATERIAL_YET_TO_DISPATCH") === filterMaterialStatus
    return matchPO && matchVendor && matchProject && matchPM && matchFM && matchPOStatus && matchMaterialStatus
  })

 const clearFilters = () => {
  setFilterPONumber("")
  setFilterVendor("")
  setFilterProjectName("")
  setFilterPMApproval("")
  setFilterFMApproval("")
  setFilterPOStatus("")           // ← ADD
  setFilterMaterialStatus("")     // ← ADD
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
            <p className="text-sm text-gray-500 mt-1">Manage POs, upload PI and GRN documents</p>
          </div>
          <button
            onClick={() => setShowUploadPOModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Upload PO
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3">
            <input
              type="text"
              placeholder="PO Number..."
              value={filterPONumber}
              onChange={(e) => setFilterPONumber(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Vendor Name..."
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Project Name..."
              value={filterProjectName}
              onChange={(e) => setFilterProjectName(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={filterPMApproval}
              onChange={(e) => setFilterPMApproval(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All PM Status</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
            </select>
                  <select
                  value={filterFMApproval}
                  onChange={(e) => setFilterFMApproval(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All FM Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PENDING">Pending</option>
                </select>
                <select
                  value={filterPOStatus}
                  onChange={(e) => setFilterPOStatus(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All PO Status</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <select
                  value={filterMaterialStatus}
                  onChange={(e) => setFilterMaterialStatus(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Material Status</option>
                  <option value="MATERIAL_YET_TO_DISPATCH">Yet to Dispatch</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="RECEIVED">Received</option>
                  <option value="GRN_DONE">GRN Done</option>
                </select>
                <button
  onClick={clearFilters}
  className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
>
  Clear Filters
</button>
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

                      {/* Vendor — not in API yet, show uploadedBy as proxy */}
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {po.vendorName || po.boqMtr?.vendorName || (po.uploadedBy ? `${po.uploadedBy.firstName} ${po.uploadedBy.lastName}` : "N/A")}
                      </td>

                      {/* Project Name(s) — derived from mtrCode */}
                      <td className="px-4 py-4 text-sm text-gray-700 max-w-[180px]">
                        <div className="space-y-1">
                          {po.projectNames?.length > 0 ? (
                            po.projectNames.map((name, i) => (
                              <div key={i} className="truncate text-xs bg-gray-100 px-2 py-0.5 rounded" title={name}>{name}</div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </div>
                      </td>

                      {/* PO Number + Copy + Previous POs */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                          <div className="text-xs text-gray-500">{formatDate(po.createdAt)}</div>
                          <div className="flex items-center gap-2">
                            {po.fileUrl && (
                              <button onClick={() => { setSelectedPO(po); setShowDetailsModal(true) }} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 underline">
                                View PO
                              </button>
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
                          {/* Previous POs expandable */}
                          {po.allPOs && po.allPOs.length > 1 && (
                            <div className="mt-1">
                              <button
                                onClick={() => setExpandedPOHistory((prev) => ({ ...prev, [po.id]: !prev[po.id] }))}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {expandedPOHistory[po.id] ? "▼" : "▶"} Previous POs ({po.allPOs.length - 1})
                              </button>
                              {expandedPOHistory[po.id] && (
                                <div className="mt-2 space-y-1">
                                  {po.allPOs.slice(1).map((p, idx) => (
                                    <div key={idx} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                                      <div className="font-medium text-gray-800">{p.poNumber}</div>
                                      {p.fileUrl && <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
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

                      {/* PM Approval */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <StatusBadge status={po.approvalStatus} />
                          {po.approvalRemarks && (
                            <p className="text-xs text-gray-500 max-w-[120px] truncate" title={po.approvalRemarks}>{po.approvalRemarks}</p>
                          )}
                        </div>
                      </td>

                      {/* FM Approval */}
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
                              showSuccess("PO status updated!")
                              fetchPOs()
                            } catch (err) {
                              console.error("Error updating PO status:", err)
                            }
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
                              showSuccess("Material status updated!")
                              fetchPOs()
                            } catch (err) {
                              console.error("Error updating material status:", err)
                            }
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
                          {/* View Details */}
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
                          {/* Upload PI — only enabled once PO has both PM and FM approval */}
                          <button
                            onClick={() => { setSelectedPO(po); setShowPIModal(true) }}
                            disabled={po.approvalStatus !== "APPROVED" || po.financeManagerApprovalStatus !== "APPROVED"}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Upload PI
                          </button>
                          {/* Upload GRN/TI — only enabled when material status is GRN_DONE */}
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

          {/* Pagination */}
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
    </div>
  )
}

export default POUploadPurchaser