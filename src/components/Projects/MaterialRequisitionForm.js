"use client"

import { useState, useEffect } from "react"

function MaterialRequisitionForm({ onSubmit, onCancel, projectCode, currentMTRCount, initialMTRData }) {
  const [formData, setFormData] = useState({
    mtrQty: "",
    stockAlloted: "0",
    purchaseMTR: "0",
    dcQty: "0",
    remarks: "",
    expectedDeliveryDate: "",
    priority: "MEDIUM",
    mtrCode: "",
  })

  useEffect(() => {
    if (initialMTRData) {
      // If initialMTRData is provided, pre-fill the form for editing
      setFormData({
        mtrQty: initialMTRData.mtrQty || "",
        stockAlloted: initialMTRData.stockAlloted || "0",
        purchaseMTR: initialMTRData.purchaseMTR || "0",
        dcQty: initialMTRData.dcQty || "0",
        remarks: initialMTRData.remarks || "",
        expectedDeliveryDate: initialMTRData.expectedDeliveryDate || "",
        priority: initialMTRData.priority || "MEDIUM",
        mtrCode: initialMTRData.mtrCode || "", // Keep existing mtrCode for edits
      })
    } else {
      // For new MTRs, generate mtrCode
      if (projectCode && currentMTRCount) {
        const generatedMtrCode = `MTR-${projectCode}-${currentMTRCount}`
        setFormData((prev) => ({ ...prev, mtrCode: generatedMtrCode }))
      }
    }
  }, [initialMTRData, projectCode, currentMTRCount])

  useEffect(() => {
    // Recalculate purchaseMTR
    if (formData.mtrQty && formData.stockAlloted) {
      const mtrQty = Number.parseFloat(formData.mtrQty) || 0
      const stockAlloted = Number.parseFloat(formData.stockAlloted) || 0
      const purchaseMTR = Math.max(0, mtrQty - stockAlloted).toFixed(2)
      setFormData((prev) => ({ ...prev, purchaseMTR }))
    }
  }, [formData.mtrQty, formData.stockAlloted])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      mtrQty: "",
      stockAlloted: "0",
      purchaseMTR: "0",
      dcQty: "0",
      remarks: "",
      expectedDeliveryDate: "",
      priority: "MEDIUM",
      mtrCode: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h5 className="font-medium mb-3 text-blue-800">
        {initialMTRData ? "Edit Material Requisition" : "Add New Material Requisition"}
      </h5>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MTR Qty</label>
          <input
            type="number"
            step="0.01"
            value={formData.mtrQty}
            onChange={(e) => setFormData((prev) => ({ ...prev, mtrQty: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase MTR</label>
          <input
            type="number"
            step="0.01"
            value={formData.purchaseMTR}
            readOnly
            className="w-full p-2 border rounded bg-gray-50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
          <input
            type="date"
            value={formData.expectedDeliveryDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MTR Code</label>
          <input
            type="text"
            value={formData.mtrCode}
            readOnly
            className="w-full p-2 border rounded bg-gray-50 focus:outline-none"
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea
          value={formData.remarks}
          onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
          placeholder="Enter remarks for this material requisition..."
          rows="2"
          className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          {initialMTRData ? "Update Material Requisition" : "Add Material Requisition"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default MaterialRequisitionForm