"use client"

import { FiX, FiEdit3 } from "react-icons/fi"

const ApprovalStatusBadge = ({ status, type = "PM" }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(status)}`}>
      {type}: {status}
    </span>
  )
}

function MaterialRequisitionList({ materialRequisitions, onRemove, onEdit, currentUserId, projectManagerId }) {
  if (!materialRequisitions || materialRequisitions.length === 0) {
    return <div className="text-center text-gray-500 py-2 text-sm">No material requisitions added yet</div>
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPMApprovalStatus = (mtr) => {
    if (mtr.pmApprovalStatus) {
      return mtr.pmApprovalStatus
    }
    // Auto-determine status based on current user and project manager
    return currentUserId === projectManagerId ? "APPROVED" : "PENDING"
  }

  return (
    <div className="space-y-2 mb-4">
      <h5 className="font-medium text-gray-800">Previous Material Requisitions ({materialRequisitions.length})</h5>
      {materialRequisitions.map((mtr, index) => (
        <div key={mtr.id} className="bg-gray-50 p-3 rounded border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">MTR #{index + 1}</span>
                {mtr.mtrCode && (
                  <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">Code: {mtr.mtrCode}</span>
                )}
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">MTR: {mtr.mtrQty}</span>
                {mtr.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(mtr.priority)}`}>
                    {mtr.priority}
                  </span>
                )}
                <ApprovalStatusBadge status={getPMApprovalStatus(mtr)} type="PM" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Stock:</span>
                  <span className="ml-1 font-medium">{mtr.stockAlloted}</span>
                </div>
                <div>
                  <span className="text-gray-600">Purchase:</span>
                  <span className="ml-1 font-medium">{mtr.purchaseMTR}</span>
                </div>
                <div>
                  <span className="text-gray-600">DC Qty:</span>
                  <span className="ml-1 font-medium">{mtr.dcQty}</span>
                </div>
                {mtr.expectedDeliveryDate && (
                  <div>
                    <span className="text-gray-600">Delivery:</span>
                    <span className="ml-1 font-medium">{new Date(mtr.expectedDeliveryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              {mtr.remarks && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Remarks:</span>
                  <span className="ml-1">{mtr.remarks}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(mtr)}
                className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                title="Edit material requisition"
              >
                <FiEdit3 size={14} />
              </button>
              <button
                onClick={() => onRemove(mtr.id)}
                className="text-red-500 hover:bg-red-50 p-1 rounded"
                title="Remove material requisition"
              >
                <FiX size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MaterialRequisitionList