"use client"

import { useState, useEffect } from "react"
import { FiX, FiUpload, FiFile, FiCheck, FiAlertCircle, FiCalendar } from "react-icons/fi"
import { projectManagementService } from "../../../services/projectManagementService"
import { useAuth } from "../../../contexts/AuthContext"

function ProjectManagementModal({ isOpen, onClose, projectId, purchaseOrderId, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Purchase Order Status
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null)
  const [poStatus, setPoStatus] = useState("")

  // Invoice Documents
  const [invoiceDocuments, setInvoiceDocuments] = useState([])
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
    invoiceType: "PI",
    file: null,
    supportDocument: null,
  })

  // Payment Document Upload
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null)
  const [paymentDocument, setPaymentDocument] = useState({
    file: null,
    documentType: "PAYMENT_ADVICE",
  })

  const [editingSharedDate, setEditingSharedDate] = useState(null)
  const [sharedDateValue, setSharedDateValue] = useState("")

  useEffect(() => {
    if (isOpen && projectId) {
      fetchPurchaseOrders()
      fetchInvoiceDocuments()
    }
  }, [isOpen, projectId])

  useEffect(() => {
    if (selectedPurchaseOrder) {
      setPoStatus(selectedPurchaseOrder.accountantApprovalStatus || "")
    }
  }, [selectedPurchaseOrder])

  const fetchPurchaseOrders = async () => {
    try {
      const orders = await projectManagementService.getProjectPurchaseOrders(projectId)
      setPurchaseOrders(orders)
      if (orders.length === 1) {
        setSelectedPurchaseOrder(orders[0])
      }
    } catch (err) {
      console.error("Error fetching purchase orders:", err)
      setError("Failed to fetch purchase orders")
    }
  }

  const fetchInvoiceDocuments = async () => {
    try {
      const documents = await projectManagementService.getProjectInvoiceDocuments(projectId)
      setInvoiceDocuments(documents)
    } catch (err) {
      console.error("Error fetching invoice documents:", err)
    }
  }

  const handleStatusChange = async () => {
    if (!poStatus) {
      setError("Please select a status")
      return
    }

    if (!selectedPurchaseOrder) {
      setError("Please select a purchase order")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await projectManagementService.updatePurchaseOrderStatus(selectedPurchaseOrder.id, poStatus)
      setSuccess("Purchase Order status updated successfully")
      await fetchPurchaseOrders()
      setTimeout(() => setSuccess(null), 3000)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError("Failed to update purchase order status")
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceUpload = async () => {
    if (!newInvoice.invoiceNumber || !newInvoice.file) {
      setError("Please provide invoice number and file")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", newInvoice.file)
      formData.append("approvalStatus", "PENDING")
      formData.append("invoiceNumber", newInvoice.invoiceNumber)
      formData.append("invoiceType", newInvoice.invoiceType)
      formData.append("uploadedBy", user.userId)

      if (newInvoice.supportDocument) {
        formData.append("supportDocument", newInvoice.supportDocument)
      }

      await projectManagementService.uploadInvoiceDocument(projectId, formData)

      setSuccess("Invoice document uploaded successfully")
      setNewInvoice({
        invoiceNumber: "",
        invoiceType: "PI",
        file: null,
        supportDocument: null,
      })

      await fetchInvoiceDocuments()
      setTimeout(() => setSuccess(null), 3000)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError("Failed to upload invoice document")
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentDocumentUpload = async () => {
    if (!selectedInvoiceForPayment || !paymentDocument.file) {
      setError("Please select an invoice and upload a file")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", paymentDocument.file)
      formData.append("documentType", paymentDocument.documentType)
      formData.append("uploadedBy", user.userId)

      await projectManagementService.uploadPaymentDocument(selectedInvoiceForPayment, formData)

      setSuccess("Payment document uploaded successfully")
      setPaymentDocument({ file: null, documentType: "PAYMENT_ADVICE" })
      setSelectedInvoiceForPayment(null)

      await fetchInvoiceDocuments()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to upload payment document")
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalStatusChange = async (invoiceId, newStatus) => {
    try {
      setLoading(true)
      await projectManagementService.updateInvoiceApprovalStatus(invoiceId, newStatus, "")
      setSuccess("Approval status updated")
      await fetchInvoiceDocuments()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to update approval status")
    } finally {
      setLoading(false)
    }
  }

  const handleSharedDateUpdate = async (invoiceId) => {
    if (!sharedDateValue) {
      setError("Please select a date")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await projectManagementService.updateInvoiceSharedDate(invoiceId, sharedDateValue)
      setSuccess("Shared date updated successfully")
      setEditingSharedDate(null)
      setSharedDateValue("")
      await fetchInvoiceDocuments()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to update shared date")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Project Management</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-4">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-2 mb-4">
              <FiCheck className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Purchase Order Status Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold mb-3">Change PO/WO Status</h4>
            {purchaseOrders.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Select Purchase Order</label>
                <select
                  value={selectedPurchaseOrder?.id || ""}
                  onChange={(e) => {
                    const po = purchaseOrders.find((p) => p.id === Number.parseInt(e.target.value))
                    setSelectedPurchaseOrder(po)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a Purchase Order</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} - Current Status: {po.accountantApprovalStatus || "Not Set"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedPurchaseOrder && (
              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                <span className="text-sm font-medium">Current Status: </span>
                <span className="text-sm font-semibold text-blue-700">
                  {selectedPurchaseOrder.accountantApprovalStatus || "Not Set"}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <select
                value={poStatus}
                onChange={(e) => setPoStatus(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                disabled={!selectedPurchaseOrder}
              >
                <option value="">Select New Status</option>
                <option value="Approve">Approve</option>
                <option value="In progress">In Progress</option>
                <option value="Revision from Sales">Revision from Sales</option>
              </select>
              <button
                onClick={handleStatusChange}
                disabled={loading || !poStatus || !selectedPurchaseOrder}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
          </div>

          {/* Upload PI/TI Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-semibold mb-3">Upload PI/TI Document</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={newInvoice.invoiceNumber}
                  onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Type</label>
                <select
                  value={newInvoice.invoiceType}
                  onChange={(e) => setNewInvoice({ ...newInvoice, invoiceType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="PI">Proforma Invoice (PI)</option>
                  <option value="TI">Tax Invoice (TI)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice File</label>
                <input
                  type="file"
                  onChange={(e) => setNewInvoice({ ...newInvoice, file: e.target.files[0] })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Support Document</label>
                <input
                  type="file"
                  onChange={(e) => setNewInvoice({ ...newInvoice, supportDocument: e.target.files[0] })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">First PI/TI uses PO as support</p>
              </div>
            </div>
            <button
              onClick={handleInvoiceUpload}
              disabled={loading}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FiUpload /> Upload Invoice
            </button>
          </div>

          {/* Uploaded Invoices List */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3">Uploaded PI/TI Documents</h4>
            {invoiceDocuments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No invoice documents uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {invoiceDocuments.map((invoice) => (
                  <div key={invoice.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-600">Type: {invoice.invoiceType}</div>
                        {invoice.sharedDate && (
                          <div className="text-sm text-gray-600">Shared: {invoice.sharedDate}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={invoice.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        >
                          <FiFile size={14} /> View
                        </a>
                      </div>
                    </div>

                    {invoice.supportDocumentUrl && (
                      <div className="text-sm text-gray-600 mb-2">
                        Support Doc:{" "}
                        <a
                          href={invoice.supportDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {invoice.supportDocumentName}
                        </a>
                      </div>
                    )}

                    
                      {invoice.approvalStatus === "APPROVED" && (
                      <>
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-amber-600" />
                              <span className="text-sm font-medium">Shared Date:</span>
                              {invoice.sharedDate && editingSharedDate !== invoice.id ? (
                                <span className="text-sm font-semibold text-amber-700">{invoice.sharedDate}</span>
                              ) : !invoice.sharedDate && editingSharedDate !== invoice.id ? (
                                <span className="text-sm text-gray-500 italic">Not set</span>
                              ) : null}
                            </div>
                            {editingSharedDate !== invoice.id && (
                              <button
                                onClick={() => {
                                  setEditingSharedDate(invoice.id)
                                  setSharedDateValue(invoice.sharedDate || "")
                                }}
                                className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                              >
                                {invoice.sharedDate ? "Edit" : "Set Date"}
                              </button>
                            )}
                          </div>

                          {editingSharedDate === invoice.id && (
                            <div className="mt-2 flex gap-2">
                              <input
                                type="date"
                                value={sharedDateValue}
                                onChange={(e) => setSharedDateValue(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                              />
                              <button
                                onClick={() => handleSharedDateUpdate(invoice.id)}
                                disabled={loading}
                                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSharedDate(null)
                                  setSharedDateValue("")
                                }}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          </div>
                        </>
                      )}
                      {/* End of Shared Date section */}
                    

                    {/* Payment Documents */}
                    {invoice.paymentDocuments && invoice.paymentDocuments.length > 0 && (
                      <div className="mt-2 pl-4 border-l-2 border-gray-300">
                        <div className="text-sm font-medium mb-1">Payment Documents:</div>
                        {invoice.paymentDocuments.map((payment) => (
                          <div key={payment.id} className="text-sm text-gray-600">
                            <a
                              href={payment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {payment.documentType}: {payment.fileName}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {invoice.approvalStatus === "APPROVED" && (
                      <button
                        onClick={() => setSelectedInvoiceForPayment(invoice.id)}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        + Add Payment Document
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Payment Document Section */}
          {selectedInvoiceForPayment && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h4 className="text-lg font-semibold mb-3">Upload Payment Advice/Receipt</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type</label>
                  <select
                    value={paymentDocument.documentType}
                    onChange={(e) => setPaymentDocument({ ...paymentDocument, documentType: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="PAYMENT_ADVICE">Payment Advice</option>
                    <option value="RECEIPT">Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">File</label>
                  <input
                    type="file"
                    onChange={(e) => setPaymentDocument({ ...paymentDocument, file: e.target.files[0] })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handlePaymentDocumentUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FiUpload /> Upload Payment Document
                </button>
                <button
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectManagementModal