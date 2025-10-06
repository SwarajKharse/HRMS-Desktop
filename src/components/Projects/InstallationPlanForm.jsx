"use client"

export default function InstallationPlanColumn({
  item,
  installationPlanItem,
  weeks,
  isEnabled,
  onInstallationChange,
  onFocusEditMode,
}) {
  return (
    <td className="px-4 py-4">
      <select
        value={installationPlanItem || ""}
        onChange={(e) => onInstallationChange(item.id, e.target.value)}
        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
        disabled={!isEnabled}
        onFocus={() => onFocusEditMode("installation")}
      >
        <option value="">Select Week</option>
        {weeks.map((week) => (
          <option key={week.weekNumber} value={week.weekNumber}>
            {week.label}
          </option>
        ))}
      </select>
      {installationPlanItem && <p className="text-xs text-gray-500 mt-1">Selected: Week {installationPlanItem}</p>}
    </td>
  )
}
