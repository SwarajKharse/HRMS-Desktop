"use client"

import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

// Helper to format date for display
const formatDate = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return "Invalid Date"
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function DispatchPlanColumn({
  item,
  dispatchPlanItem,
  isEnabled,
  onDispatchLeadTimeChange,
  onFocusEditMode,
  fetchItemHistory,
  navigateHistory,
  historyData,
}) {
  const displayDispatchDate =
    isEnabled && dispatchPlanItem?.date
      ? dispatchPlanItem.date.toISOString().split("T")[0]
      : historyData?.versions[historyData.currentDisplayIndex]?.planDate ||
        (dispatchPlanItem?.date ? dispatchPlanItem.date.toISOString().split("T")[0] : "")

  const displayDispatchLeadTime = isEnabled
    ? dispatchPlanItem?.leadTime || ""
    : historyData?.versions[historyData.currentDisplayIndex]?.leadTime || dispatchPlanItem?.leadTime || ""

  return (
    <td className="px-4 py-4">
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <div className="flex items-center">
            <button
              onClick={() => navigateHistory(item.id, "DISPATCH", -1)}
              disabled={!isEnabled || !historyData?.versions.length}
              className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
              onFocus={() => fetchItemHistory(item.id, "DISPATCH")}
            >
              <FiChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={displayDispatchDate}
              disabled={true} // Always disabled as it's auto-calculated
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm mx-1"
            />
            <button
              onClick={() => navigateHistory(item.id, "DISPATCH", 1)}
              disabled={!isEnabled || !historyData?.versions.length}
              className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
              onFocus={() => fetchItemHistory(item.id, "DISPATCH")}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {dispatchPlanItem?.date ? formatDate(dispatchPlanItem.date) : "Auto-calculated"}
          </p>
          {historyData?.versions.length > 0 && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              Version: {historyData.versions[historyData.currentDisplayIndex]?.version}
              {historyData.currentDisplayIndex === 0 && " (Latest)"}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Lead Time (days)</label>
          <div className="flex items-center">
            <button
              onClick={() => navigateHistory(item.id, "DISPATCH", -1)}
              disabled={!isEnabled || !historyData?.versions.length}
              className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
              onFocus={() => fetchItemHistory(item.id, "DISPATCH")}
            >
              <FiChevronLeft size={16} />
            </button>
            <input
              type="number"
              min="0"
              value={displayDispatchLeadTime}
              onChange={(e) => onDispatchLeadTimeChange(item.id, e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm mx-1"
              disabled={!isEnabled}
              onFocus={() => onFocusEditMode("dispatch")}
            />
            <button
              onClick={() => navigateHistory(item.id, "DISPATCH", 1)}
              disabled={!isEnabled || !historyData?.versions.length}
              className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
              onFocus={() => fetchItemHistory(item.id, "DISPATCH")}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </td>
  )
}
