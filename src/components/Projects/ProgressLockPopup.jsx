"use client"

// Shown when a locked project's guarded action (Add Requisition, PM Approve/Reject) is
// clicked. Three messages depending on why it's locked:
//  - needsApproval: backlog is beyond the 2-day self-serve window, needs Management.
//  - overrideActive: Management already approved — still locked until the backlog is filled.
//  - plain: within the self-serve window, SE/PM can just fill it themselves.
export default function ProgressLockPopup({ lockPopup, onClose, onFillNow }) {
  if (!lockPopup) return null
  const { needsApproval, overrideActive, oldestUnfilledDate } = lockPopup

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {needsApproval ? "Approval Required" : "Progress Required"}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {needsApproval
            ? `Progress hasn't been logged since ${oldestUnfilledDate}. This is more than 2 days behind, so it needs Management approval before requisitions can be added or approved/rejected. Contact Aditya sir to get it unlocked.`
            : overrideActive
            ? `Management has approved backdated progress filling for this project. Please complete progress for the pending days first — requisitions can be added/approved again once it's caught up.`
            : `Progress hasn't been logged since ${oldestUnfilledDate}. Requisitions can't be added or approved/rejected until it's filled. Click OK to fill it now.`}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
            onClick={onClose}
          >
            {needsApproval ? "OK" : "Cancel"}
          </button>
          {!needsApproval && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              onClick={onFillNow}
            >
              OK, Fill Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
