"use client"

import { useState, useEffect } from "react"
import { FiAlertCircle, FiCheck, FiUpload, FiX, FiCalendar, FiFileText } from "react-icons/fi"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"

function PaymentCompletionModal({ isOpen, onClose, invoice, onComplete }) {
  const [approvalStatus, setApprovalStatus] = useState("APPROVED")
  const [paymentDoneDate, setPaymentDoneDate] = useState("")
  const [receiptFile, setReceiptFile] = useState(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && invoice) {
      console.log("[v0] Modal opened with invoice:", invoice)
      console.log("[v0] paymentDoneDate:", invoice.paymentDoneDate)
      console.log("[v0] paymentReceiptUrl:", invoice.paymentReceiptUrl)

      if (invoice.paymentDoneDate) {
        const dateObj = new Date(invoice.paymentDoneDate)
        const formattedDate = dateObj.toISOString().split("T")[0]
        setPaymentDoneDate(formattedDate)
      } else {
        const today = new Date().toISOString().split("T")[0]
        setPaymentDoneDate(today)
      }

      if (invoice.paymentReceiptUrl) {
        setExistingReceiptUrl(invoice.paymentReceiptUrl)
      } else if (invoice.payment_receipt_url) {
        setExistingReceiptUrl(invoice.payment_receipt_url)
      } else {
        setExistingReceiptUrl(null)
      }

      setApprovalStatus("APPROVED")
      setReceiptFile(null)
      setError(null)
    }
  }, [isOpen, invoice])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif"]
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a PDF or image file (JPEG, PNG, GIF)")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      setReceiptFile(file)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!paymentDoneDate) {
      setError("Payment done date is required")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await purchaseInvoiceService.completePayment(invoice.id, approvalStatus, paymentDoneDate, receiptFile)

      const updatedInvoice = await purchaseInvoiceService.getPurchaseInvoiceById(invoice.id)
      onComplete(updatedInvoice)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to complete payment")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return "₹0"
    return `₹${Number.parseFloat(amount).toLocaleString("en-IN")}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (!isOpen || !invoice) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Complete Payment</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-3">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">PI Number:</span>
                <div className="text-gray-900">{invoice.piNumber}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">PO Number:</span>
                <div className="text-gray-900">{invoice.purchaseOrder?.poNumber || "N/A"}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Project:</span>
                <div className="text-gray-900">{invoice.projectName}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Payable Amount:</span>
                <div className="text-gray-900 font-semibold">{formatCurrency(invoice.payableAmount)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Expected Payment Date:</span>
                <div className="text-gray-900">{formatDate(invoice.expectedPaymentDate)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Payment Cycle:</span>
                <div className="text-gray-900">{invoice.paymentCycle || "N/A"}</div>
              </div>
              {invoice.fileUrl && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">PI File:</span>
                  <div>
                    <a
                      href={invoice.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      {invoice.fileName || "View File"}
                    </a>
                  </div>
                </div>
              )}
              {invoice.purchaseOrder?.fileUrl && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">PO File:</span>
                  <div>
                    <a
                      href={invoice.purchaseOrder.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      {invoice.purchaseOrder.fileName || "View PO File"}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCheck className="w-4 h-4 inline mr-2" />
                Approval Status
              </label>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              >
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="w-4 h-4 inline mr-2" />
                Payment Done Date *
              </label>
              <input
                type="date"
                value={paymentDoneDate}
                onChange={(e) => setPaymentDoneDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiUpload className="w-4 h-4 inline mr-2" />
                Payment Receipt (Optional)
              </label>

              {existingReceiptUrl && !receiptFile && (
                <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-2">Previously uploaded receipt:</p>
                  <a
                    href={existingReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-2"
                  >
                    <FiFileText className="w-4 h-4" />
                    View Receipt
                  </a>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                  id="receipt-upload"
                  disabled={loading}
                />
                <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center">
                  <FiFileText className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {receiptFile ? receiptFile.name : "Click to upload payment receipt"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">PDF, JPEG, PNG, GIF (max 10MB)</span>
                </label>
              </div>
              {receiptFile && (
                <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
                  <span className="text-sm text-green-700">File selected: {receiptFile.name}</span>
                  <button onClick={() => setReceiptFile(null)} className="text-red-500 hover:text-red-700">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !paymentDoneDate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentCompletionModal