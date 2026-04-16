"use client"

import { useState, useEffect, useCallback } from "react"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { purchaseOrderService } from "../../../services/purchaseOrderService"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"
import { grnService } from "../../../services/grnService"
import { useAuth } from "../../../contexts/AuthContext"
import VendorDropdownPOUpload from "./VendorDropdownPOUpload"

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

// ─── PO Details Modal ────────────────────────────────────────────────────────
function PODetailsModal({ isOpen, onClose, po }) {
  const [piList, setPIList] = useState([])
  const [grnList, setGrnList] = useState([])
  const [loading, setLoading] = useState(false)

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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">PO Number:</span> <span className="font-medium">{po.poNumber}</span></div>
              <div><span className="text-gray-500">Material Status:</span> <StatusBadge status={po.materialStatus} /></div>
              <div><span className="text-gray-500">PO Status:</span> <StatusBadge status={po.poStatus} /></div>
              <div><span className="text-gray-500">Created:</span> <span className="font-medium">{formatDate(po.createdAt)}</span></div>
            </div>
          </div>

          {/* MTR Details Table */}
          {po.allMTRIds && po.allMTRIds.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">MTR Details ({po.allMTRIds.length} items)</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["MTR Code", "Project", "Item Name", "Qty"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {/* Use the allMTRData stored on the PO object */}
                    {(po.allMTRData || [po]).map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-medium text-gray-700">{entry.boqMtr?.mtrCode || "N/A"}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {entry.boqMtr?.mtrCode
                            ? entry.boqMtr.mtrCode.replace(/^MTR-/, "").replace(/-\d+$/, "").replace(/-/g, " ").trim()
                            : "N/A"}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{entry.boqMtr?.remarks || "N/A"}</td>
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
              {/* GRNs */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Goods Receipt Notes ({grnList.length})</h4>
                {grnList.length === 0 ? (
                  <p className="text-sm text-gray-500">No GRNs uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {grnList.map((grn, idx) => (
                      <div key={grn.id || idx} className="border border-gray-200 rounded-lg p-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div><span className="text-gray-500">GRN Number:</span> <span className="font-medium">{grn.grnNumber || "N/A"}</span></div>
                          <div><span className="text-gray-500">Payable Amount:</span> <span className="font-medium">₹{grn.payableAmount || "0"}</span></div>
                          <div><span className="text-gray-500">Expected Date:</span> <span className="font-medium">{formatDate(grn.expectedPayableDate)}</span></div>
                          <div><span className="text-gray-500">Uploaded:</span> <span className="font-medium">{formatDate(grn.createdAt)}</span></div>
                          <div><span className="text-gray-500">PM Approval:</span> <StatusBadge status={grn.purchaseManagerApprovalStatus} /></div>
                          <div><span className="text-gray-500">FM Approval:</span> <StatusBadge status={grn.purchaseOrder?.financeManagerApprovalStatus} /></div>
                          {grn.purchaseManagerApprovalRemarks && (
                            <div className="col-span-2"><span className="text-gray-500">PM Remarks:</span> <span className="text-sm text-gray-700">{grn.purchaseManagerApprovalRemarks}</span></div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {grn.grnCopyUrl && (
                            <a href={grn.grnCopyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View GRN Copy</a>
                          )}
                          {grn.testCertificateUrl && (
                            <a href={grn.testCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View Test Certificate</a>
                          )}
                          {grn.invoiceCopyUrl && (
                            <a href={grn.invoiceCopyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View Invoice Copy</a>
                          )}
                        </div>
                        {grn.remarks && <p className="mt-2 text-xs text-gray-600">Remarks: {grn.remarks}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Proforma Invoices */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Proforma Invoices ({piList.length})</h4>
                {piList.length === 0 ? (
                  <p className="text-sm text-gray-500">No PIs uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {piList.map((pi, idx) => (
                      <div key={pi.id || idx} className="border border-gray-200 rounded-lg p-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-gray-500">PI Number:</span>{" "}
                            {pi.fileUrl ? (
                              <a href={pi.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">{pi.piNumber || "N/A"}</a>
                            ) : (
                              <span className="font-medium">{pi.piNumber || "N/A"}</span>
                            )}
                          </div>
                          <div><span className="text-gray-500">Amount:</span> <span className="font-medium">₹{pi.payableAmount || "0"}</span></div>
                          <div><span className="text-gray-500">Project:</span> <span className="font-medium">{pi.projectName || "N/A"}</span></div>
                          <div><span className="text-gray-500">Finance Manager:</span> <StatusBadge status={pi.financeManagerApproval} /></div>
                          <div><span className="text-gray-500">Accounts Manager:</span> <StatusBadge status={pi.accountManagerApprovalStatus} /></div>
                          <div><span className="text-gray-500">Payment Status:</span> <StatusBadge status={pi.paymentStatus} /></div>
                          {pi.paymentDoneDate && (
                            <div><span className="text-gray-500">Payment Date:</span> <span className="font-medium">{formatDate(pi.paymentDoneDate)}</span></div>
                          )}
                          {pi.paymentReceiptUrl && (
                            <div>
                              <a href={pi.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">View Payment Receipt</a>
                            </div>
                          )}
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
    </div>
  )
}

// ─── PI Upload Modal ─────────────────────────────────────────────────────────
function PIUploadModal({ isOpen, onClose, po, onSuccess }) {
  const { user } = useAuth()
  const [piFile, setPIFile] = useState(null)
  const [shareStatus, setShareStatus] = useState("")
  const [payableAmount, setPayableAmount] = useState("")
  const [selectedProjectName, setSelectedProjectName] = useState("")
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("")
  const [remarks, setRemarks] = useState("")
  const [projectNames, setProjectNames] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchProjectNames()
      resetForm()
    }
  }, [isOpen])

  const fetchProjectNames = async () => {
    try {
      const names = await purchaseInvoiceService.getProjectNames()
      setProjectNames(names || [])
    } catch (e) {
      console.error("Error fetching project names:", e)
    }
  }

  const resetForm = () => {
    setPIFile(null)
    setShareStatus("")
    setPayableAmount("")
    setSelectedProjectName("")
    setExpectedPaymentDate("")
    setRemarks("")
    setError(null)
  }

  const handleSubmit = async () => {
    if (!piFile || !shareStatus || !payableAmount || !selectedProjectName || !expectedPaymentDate) {
      setError("Please fill in all required fields")
      return
    }
    try {
      setUploading(true)
      setError(null)
      const formData = new FormData()
      formData.append("file", piFile)
      formData.append("shareStatus", shareStatus)
      formData.append("payableAmount", payableAmount)
      formData.append("projectName", selectedProjectName)
      formData.append("expectedPaymentDate", expectedPaymentDate)
      formData.append("remarks", remarks)
      formData.append("poId", po.id)
      formData.append("uploadedBy", user?.userId || user?.id || 1)
      await purchaseInvoiceService.uploadPurchaseInvoice(formData)
      onSuccess("PI uploaded successfully!")
      onClose()
    } catch (e) {
      console.error("Error uploading PI:", e)
      setError("Failed to upload PI. Please try again.")
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Share Status <span className="text-red-500">*</span></label>
            <select value={shareStatus} onChange={(e) => setShareStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading}>
              <option value="">Select Status</option>
              <option value="SHARED">Shared</option>
              <option value="NOT_SHARED">Not Shared</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payable Amount <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" value={payableAmount} onChange={(e) => setPayableAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="0.00" disabled={uploading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
            <select value={selectedProjectName} onChange={(e) => setSelectedProjectName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={uploading}>
              <option value="">Select Project</option>
              {projectNames.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
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
function GRNUploadModal({ isOpen, onClose, po, onSuccess }) {
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

  useEffect(() => {
    if (isOpen && po?.id) {
      fetchLatestPI()
      resetForm()
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
      setError(e.response?.data?.message || "Failed to upload GRN. Please try again.")
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
            <input type="number" step="0.01" value={payableAmount} onChange={(e) => setPayableAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="0.00" disabled={uploading} />
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

// ─── Upload PO Modal (3-step, unchanged logic) ───────────────────────────────
function UploadPOModal({ isOpen, onClose, onSuccess, user }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedVendor, setSelectedVendor] = useState("")
  const [selectedMTRs, setSelectedMTRs] = useState([])
  const [mtrs, setMtrs] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [poFile, setPOFile] = useState(null)
  const [poNumber, setPONumber] = useState("")
  const [message, setMessage] = useState({ type: "", text: "" })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 5000)
  }

  const reset = () => {
    setCurrentStep(1)
    setSelectedVendor("")
    setSelectedMTRs([])
    setMtrs([])
    setPOFile(null)
    setPONumber("")
    setMessage({ type: "", text: "" })
  }

  const handleClose = () => { reset(); onClose() }

  useEffect(() => {
    if (selectedVendor && currentStep === 2) fetchMTRs()
  }, [selectedVendor, currentStep])

  const fetchMTRs = async () => {
    try {
      setLoading(true)
      const data = await comparisonSheetService.getMTRsByApprovedVendor({ vendorName: selectedVendor, assignedPurchaser: user?.userId || 1 })
      setMtrs(data || [])
      setSelectedMTRs(data?.map((m) => m.id) || [])
    } catch (e) {
      console.error("Error fetching MTRs:", e)
      setMtrs([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!poFile || selectedMTRs.length === 0 || !poNumber.trim()) {
      showMessage("error", "Please enter PO Number, select a file and MTRs")
      return
    }
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", poFile)
      selectedMTRs.forEach((id) => formData.append("mtrIds", id))
      formData.append("vendorName", selectedVendor)
      formData.append("uploadedBy", user?.userId || 1)
      formData.append("poNumber", poNumber.trim())
      formData.append("currentUserId", user?.userId)
      await comparisonSheetService.uploadPOForMTRs(formData)
      showMessage("success", `PO uploaded successfully!`)
      setTimeout(() => { handleClose(); onSuccess("PO uploaded successfully!") }, 1500)
    } catch (e) {
      console.error("Error uploading PO:", e)
      showMessage("error", "Error uploading PO. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col" style={{ height: "90vh" }}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Upload Purchase Order</h2>
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

        {/* Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-6">
            {[{ n: 1, label: "Select Vendor" }, { n: 2, label: "Select MTRs" }, { n: 3, label: "Upload PO" }].map(({ n, label }) => (
              <div key={n} className={`flex items-center space-x-2 ${currentStep >= n ? "text-blue-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= n ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>{n}</div>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Step 1: Select Vendor</h3>
              <label className="block text-sm font-medium text-gray-700">Choose Vendor</label>
              <VendorDropdownPOUpload value={selectedVendor} onChange={(v) => { setSelectedVendor(v); setCurrentStep(2) }} placeholder="Search and select vendor..." />
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Step 2: Select MTRs</h3>
                <button onClick={() => { setSelectedVendor(""); setCurrentStep(1) }} className="text-blue-600 hover:text-blue-800 text-sm">← Back to Vendor Selection</button>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">Selected Vendor: <span className="font-medium">{selectedVendor}</span></div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading MTRs...</div>
              ) : mtrs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No MTRs found for this vendor</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{selectedMTRs.length} of {mtrs.length} MTRs selected</span>
                    <button onClick={() => setSelectedMTRs(selectedMTRs.length === mtrs.length ? [] : mtrs.map((m) => m.id))} className="text-blue-600 hover:text-blue-800 font-medium">
                      {selectedMTRs.length === mtrs.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                      <div className="col-span-1">Select</div>
                      <div className="col-span-3">Project Name</div>
                      <div className="col-span-4">Product Name</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Created Date</div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {mtrs.map((mtr) => (
                        <div key={mtr.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 grid grid-cols-12 gap-4 items-center text-sm">
                          <div className="col-span-1"><input type="checkbox" checked={selectedMTRs.includes(mtr.id)} onChange={() => setSelectedMTRs((prev) => prev.includes(mtr.id) ? prev.filter((id) => id !== mtr.id) : [...prev, mtr.id])} className="w-4 h-4 text-blue-600 border-gray-300 rounded" /></div>
                          <div className="col-span-3 truncate" title={mtr.projectName}>{mtr.projectName || "N/A"}</div>
                          <div className="col-span-4 truncate" title={mtr.productName}>{mtr.productName || "N/A"}</div>
                          <div className="col-span-2 font-semibold">{mtr.quantity || mtr.purchaseMTR || "N/A"}</div>
                          <div className="col-span-2">{mtr.createdAt ? new Date(mtr.createdAt).toLocaleDateString() : "N/A"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => setCurrentStep(3)} disabled={selectedMTRs.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                      Continue to Upload ({selectedMTRs.length} MTRs)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Step 3: Upload PO</h3>
                <button onClick={() => setCurrentStep(2)} className="text-blue-600 hover:text-blue-800 text-sm">← Back to MTR Selection</button>
              </div>
              <div className="bg-blue-50 p-4 rounded-md space-y-1 text-sm text-blue-800">
                <p><span className="font-medium">Vendor:</span> {selectedVendor}</p>
                <p><span className="font-medium">Selected MTRs:</span> {selectedMTRs.length} items</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Number <span className="text-red-500">*</span></label>
                <input type="text" value={poNumber} onChange={(e) => setPONumber(e.target.value)} placeholder="Enter Purchase Order Number" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Purchase Order File <span className="text-red-500">*</span></label>
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setPOFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {poFile && <p className="mt-1 text-sm text-green-600">Selected: {poFile.name}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={reset} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpload} disabled={!poFile || !poNumber.trim() || uploading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {uploading ? "Uploading..." : "Upload PO"}
                </button>
              </div>
            </div>
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

  // Modal state
  const [showUploadPOModal, setShowUploadPOModal] = useState(false)
  const [showPIModal, setShowPIModal] = useState(false)
  const [showGRNModal, setShowGRNModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
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

        // Extract project name from mtrCode: "MTR-testclientfor1501testflow-1" → clean up
        // The boqMtr doesn't have projectName directly, so we derive it from mtrCode
        // mtrCode format: MTR-{projectidentifier}-{number}
        const mtrCode = po.boqMtr?.mtrCode || ""
        // Try to get a readable project name from mtrCode by removing "MTR-" prefix and trailing "-N"
        const derivedProject = mtrCode
          ? mtrCode.replace(/^MTR-/, "").replace(/-\d+$/, "").replace(/-/g, " ").trim()
          : null

        if (!poMap.has(key)) {
          poMap.set(key, {
            ...po,
            // Use the highest id entry as the "latest" PO for this poNumber
            projectNames: derivedProject ? [derivedProject] : [],
            mtrCodes: mtrCode ? [mtrCode] : [],
            allMTRIds: [po.id],
            allMTRData: [po],
          })
        } else {
          const existing = poMap.get(key)
          // Keep the entry with the highest id (latest)
          const latest = po.id > existing.id ? po : existing
          // Merge project names — avoid duplicates
          const mergedProjects = [...new Set([
            ...existing.projectNames,
            ...(derivedProject ? [derivedProject] : []),
          ])]
          const mergedMTRCodes = [...new Set([...existing.mtrCodes, ...(mtrCode ? [mtrCode] : [])])]
          poMap.set(key, {
            ...latest,
            projectNames: mergedProjects,
            mtrCodes: mergedMTRCodes,
            allMTRIds: [...existing.allMTRIds, po.id],
            allMTRData: [...existing.allMTRData, po],
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
    return matchPO && matchVendor && matchProject && matchPM && matchFM
  })

  const clearFilters = () => {
    setFilterPONumber("")
    setFilterVendor("")
    setFilterProjectName("")
    setFilterPMApproval("")
    setFilterFMApproval("")
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                    {["Vendor", "Project Name(s)", "PO Number / Copy", "PM Approval", "FM Approval", "Actions"].map((h) => (
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
                          {po.fileUrl && (
                            <a href={po.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 underline">
                              View PO
                            </a>
                          )}
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
                          {/* Upload PI */}
                          <button
                            onClick={() => { setSelectedPO(po); setShowPIModal(true) }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium"
                          >
                            Upload PI
                          </button>
                          {/* Upload GRN/TI */}
                          <button
                            onClick={() => { setSelectedPO(po); setShowGRNModal(true) }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
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
    </div>
  )
}

export default POUploadPurchaser