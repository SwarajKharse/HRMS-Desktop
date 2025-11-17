"use client"

import { useState } from "react"
import PurchaseInvoiceForm from "./PurchaseInvoiceForm"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"

const PurchaseInvoiceFormIntegration = ({ invoice, onClose, onSuccess, isOpen }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await purchaseInvoiceService.updatePurchaseInvoiceForm(invoice.id, formData)

      setSuccess("Invoice updated successfully!")

      if (onSuccess) {
        onSuccess()
      }

      // Close after a brief delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error updating invoice:", error)
      const errorMessage = error.response?.data?.message || "Failed to update invoice. Please try again."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <PurchaseInvoiceForm
      invoice={invoice}
      onSubmit={handleSubmit}
      onCancel={onClose}
      loading={loading}
      error={error}
      success={success}
    />
  )
}

export default PurchaseInvoiceFormIntegration
