"use client"
import { useState, useEffect } from "react"
import { Calendar, Truck, Package, X } from "lucide-react" // Using lucide-react as in previous response
import { projectService } from "../../services/projectService" // Adjusted path

function ProjectDispatch({ project, onClose, onSave }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [boqItems, setBoqItems] = useState([])
  const [weeks, setWeeks] = useState([])
  const [projectInitDate, setProjectInitDate] = useState(new Date())
  const [numWeeks, setNumWeeks] = useState(12) // Default to 12 weeks
  const [installationPlan, setInstallationPlan] = useState({})
  const [procurementPlan, setProcurementPlan] = useState({})
  const [dispatchPlan, setDispatchPlan] = useState({})
  const [dispatchHistory, setDispatchHistory] = useState({}) // Renamed from procurementHistory

  // Helper to format Date object to YYYY-MM-DD string for input type="date"
  // This version correctly handles local dates without timezone shifts
  const toISODateString = (date) => {
    if (!date) return ""
    const d = date instanceof Date ? date : new Date(date)
    // Get year, month, day in local time
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, "0") // Month is 0-indexed
    const day = d.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Format date to display format (e.g., "Jul 23, 2025")
  const formatDate = (date) => {
    if (!date) return ""
    // Ensure date is a Date object before calling methods
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Generate array of weeks based on project initiation date
  const generateWeeks = (startDate, numberOfWeeks) => {
    const weeksList = []
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0) // Normalize to start of the day to avoid timezone issues
    for (let i = 0; i < numberOfWeeks; i++) {
      const weekStart = new Date(start) // Create a copy of the initial start date
      weekStart.setDate(start.getDate() + i * 7) // Add i weeks
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6) // End of the 7-day week (0-indexed, so +6 for 7 days total)
      weeksList.push({
        weekNumber: i + 1,
        startDate: weekStart, // Keep as Date object for calculations
        endDate: weekEnd, // Keep as Date object for calculations
        label: `Week ${i + 1} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
      })
    }
    setWeeks(weeksList)
  }

  // Fetch BOQ items and project details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const boqData = await projectService.getBOQByProjectId(project.id)
        const projectDetails = await projectService.getProjectDetails(project.id)
        const existingPlans = await projectService.getProjectPlansByProjectId(project.id) // This returns List<ProjectPlanItemDTO>
        // Fetch DISPATCH history (corrected function name)
        const historyData = await projectService.getProjectPlanHistory(project.id, "DISPATCH")

        const initDate = projectDetails?.projectInitiationDate
          ? new Date(projectDetails.projectInitiationDate)
          : new Date()
        setProjectInitDate(initDate)
        const numWeeksFromProject = projectDetails?.numberOfWeeks || 12
        setNumWeeks(numWeeksFromProject)
        generateWeeks(initDate, numWeeksFromProject)

        // Consolidate all item types into a single array
        const combinedItems = []
        // Add Billable Items and then iterate through their nested items
        ;(boqData.items || []).forEach((item) => {
          // Add the main billable item
          combinedItems.push({
            id: `boq-${item.id}`, // Unique ID for React key, prefix to avoid collision
            boqItemId: item.id, // Actual BOQItem ID for backend
            boqCategoryItemId: null, // Not applicable for top-level
            productName: item.product?.productName || "N/A",
            quantity: item.totalQty,
            mainCategory: item.product?.categoryId?.label || "N/A",
            type: "Billable",
            originalItem: item,
          })
          // Add nested Non-Billable Items
          ;(item.nonBillableItems || []).forEach((nestedItem) => {
            combinedItems.push({
              id: `cat-${nestedItem.id}`, // Unique ID for React key
              boqItemId: null, // Not applicable for category item plan
              boqCategoryItemId: nestedItem.id, // Actual BOQCategoryItem ID for backend
              productName: nestedItem.productName || nestedItem.make || "N/A",
              quantity: nestedItem.qty,
              mainCategory: "Non-Billable",
              type: "Non-Billable",
              originalItem: nestedItem,
            })
          })
          // Add nested Skillset Items
          ;(item.skillSetItems || []).forEach((nestedItem) => {
            combinedItems.push({
              id: `cat-${nestedItem.id}`, // Unique ID for React key
              boqItemId: null, // Not applicable for category item plan
              boqCategoryItemId: nestedItem.id, // Actual BOQCategoryItem ID for backend
              productName: nestedItem.productName || "N/A",
              quantity: nestedItem.qty,
              mainCategory: nestedItem.categoryId?.label || "Skillset",
              type: "Skillset",
              originalItem: nestedItem,
            })
          })
          // Add nested Tools Items
          ;(item.toolsItems || []).forEach((nestedItem) => {
            combinedItems.push({
              id: `cat-${nestedItem.id}`, // Unique ID for React key
              boqItemId: null, // Not applicable for category item plan
              boqCategoryItemId: nestedItem.id, // Actual BOQCategoryItem ID for backend
              productName: nestedItem.productName || "N/A",
              quantity: nestedItem.qty,
              mainCategory: nestedItem.categoryId?.label || "Tool",
              type: "Tool",
              originalItem: nestedItem,
            })
          })
        })
        setBoqItems(combinedItems)

        // Initialize plans from existingPlans (List<ProjectPlanItemDTO>)
        const installationInit = {}
        const procurementInit = {}
        const dispatchInit = {}
        if (existingPlans && Array.isArray(existingPlans)) {
          existingPlans.forEach((planItem) => {
            // Determine the correct key based on whether it's a BOQItem or BOQCategoryItem plan
            const key = planItem.boqItemId ? `boq-${planItem.boqItemId}` : `cat-${planItem.boqCategoryItemId}`
            switch (planItem.planType) {
              case "INSTALLATION":
                installationInit[key] = planItem.weekNumber // Store as number
                break
              case "PROCUREMENT":
                procurementInit[key] = {
                  date: planItem.planDate || null, // Store as YYYY-MM-DD string
                  leadTime: planItem.leadTime || 0, // Ensure leadTime is a number
                }
                break
              case "DISPATCH":
                dispatchInit[key] = {
                  date: planItem.planDate || null, // Store as YYYY-MM-DD string
                  leadTime: planItem.leadTime || 0, // Ensure leadTime is a number
                }
                break
              default:
                break
            }
          })
        }
        setInstallationPlan(installationInit)
        setProcurementPlan(procurementInit)
        setDispatchPlan(dispatchInit)

        // Process history data for DISPATCH
        const dispatchHistoryMap = {}
        if (historyData && Array.isArray(historyData)) {
          historyData.forEach((historyItem) => {
            // Determine the correct key based on whether it's a BOQItem or BOQCategoryItem history
            const key = historyItem.boqItemId ? `boq-${historyItem.boqItemId}` : `cat-${historyItem.boqCategoryItemId}`
            if (!dispatchHistoryMap[key]) {
              dispatchHistoryMap[key] = []
            }
            dispatchHistoryMap[key].push(historyItem)
          })
          // Sort history by recordedAt descending
          Object.keys(dispatchHistoryMap).forEach((key) => {
            dispatchHistoryMap[key].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
          })
        }
        setDispatchHistory(dispatchHistoryMap) // Set dispatch history

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load project data")
        setLoading(false)
      }
    }
    fetchData()
  }, [project.id])

  // Handle installation week selection
  const handleInstallationChange = (itemKey, weekNumber) => {
    setInstallationPlan((prev) => ({
      ...prev,
      [itemKey]: Number.parseInt(weekNumber), // Store as number
    }))
    const selectedWeek = weeks.find((week) => week.weekNumber === Number.parseInt(weekNumber))
    if (selectedWeek) {
      // Procurement date is directly the start date of the selected installation week
      const procurementDateCalc = new Date(selectedWeek.startDate)
      const newProcurementDateString = toISODateString(procurementDateCalc)
      setProcurementPlan((prev) => {
        const newProcurementPlan = {
          ...prev,
          [itemKey]: {
            ...prev[itemKey],
            date: newProcurementDateString, // Store as YYYY-MM-DD string
          },
        }
        // Update dispatch date when procurement date changes, using procurement's lead time
        // Pass Date object for calculation, but store string
        updateDispatchDate(itemKey, procurementDateCalc, newProcurementPlan[itemKey]?.leadTime || 0)
        return newProcurementPlan
      })
    } else {
      // If no week selected, clear procurement and dispatch dates
      setProcurementPlan((prev) => {
        const newProcurementPlan = {
          ...prev,
          [itemKey]: {
            ...prev[itemKey],
            date: null,
          },
        }
        updateDispatchDate(itemKey, null, newProcurementPlan[itemKey]?.leadTime || 0)
        return newProcurementPlan
      })
    }
  }

  // New handler for Procurement Date
  const handleProcurementDateChange = (itemKey, dateString) => {
    setProcurementPlan((prev) => {
      const newProcurementPlan = {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          date: dateString,
        },
      }
      // Recalculate dispatch date based on new procurement date and existing lead time
      const procurementDate = dateString ? new Date(dateString) : null
      updateDispatchDate(itemKey, procurementDate, newProcurementPlan[itemKey]?.leadTime || 0)
      return newProcurementPlan
    })
  }

  // New handler for Procurement Lead Time
  const handleProcurementLeadTimeChange = (itemKey, leadTime) => {
    const newLeadTime = Number.parseInt(leadTime) || 0
    setProcurementPlan((prev) => {
      const newProcurementPlan = {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          leadTime: newLeadTime,
        },
      }
      // Recalculate dispatch date based on existing procurement date and new lead time
      const procurementDateString = newProcurementPlan[itemKey]?.date
      const procurementDate = procurementDateString ? new Date(procurementDateString) : null
      updateDispatchDate(itemKey, procurementDate, newLeadTime)
      return newProcurementPlan
    })
  }

  // Calculate and update dispatch date based on procurement date and lead time
  // procurementDateParam is expected to be a Date object for calculation
  const updateDispatchDate = (itemKey, procurementDateParam, leadTimeDays) => {
    if (!procurementDateParam) {
      setDispatchPlan((prev) => ({
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          date: null,
        },
      }))
      return
    }
    const dispatchDateCalc = new Date(procurementDateParam)
    dispatchDateCalc.setDate(dispatchDateCalc.getDate() + leadTimeDays)
    const newDispatchDateString = toISODateString(dispatchDateCalc)
    setDispatchPlan((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        date: newDispatchDateString, // Store as YYYY-MM-DD string
      },
    }))
  }

  // Save project initiation plan
  const handleSave = async () => {
    try {
      setLoading(true)
      const plansToSave = []
      boqItems.forEach((item) => {
        const itemKey = item.id // Use the combined item's unique key
        // Determine the correct ID to send to backend
        const boqItemId = item.boqItemId
        const boqCategoryItemId = item.boqCategoryItemId

        // Installation Plan
        if (installationPlan[itemKey] !== null && installationPlan[itemKey] !== undefined) {
          plansToSave.push({
            boqItemId: boqItemId,
            boqCategoryItemId: boqCategoryItemId,
            planType: "INSTALLATION",
            weekNumber: installationPlan[itemKey], // Already a number
            planDate: null, // Not applicable for INSTALLATION
            leadTime: null, // Not applicable for INSTALLATION
          })
        }
        // Procurement Plan
        if (procurementPlan[itemKey]?.date) {
          plansToSave.push({
            boqItemId: boqItemId,
            boqCategoryItemId: boqCategoryItemId,
            planType: "PROCUREMENT",
            planDate: procurementPlan[itemKey].date, // Already a YYYY-MM-DD string
            leadTime: procurementPlan[itemKey].leadTime || 0,
            weekNumber: null, // Not applicable for PROCUREMENT
          })
        }
        // Dispatch Plan
        if (dispatchPlan[itemKey]?.date) {
          plansToSave.push({
            boqItemId: boqItemId,
            boqCategoryItemId: boqCategoryItemId,
            planType: "DISPATCH",
            planDate: dispatchPlan[itemKey].date, // Already a YYYY-MM-DD string
            leadTime: dispatchPlan[itemKey].leadTime || 0,
            weekNumber: null, // Not applicable for DISPATCH
          })
        }
      })

      // Assuming ProjectPlanSaveRequestDTO expects a 'plans' array and 'projectId'
      const saveRequest = {
        projectId: project.id,
        plans: plansToSave,
      }

      // --- DEBUGGING LOGS ---
      console.log("Frontend boqItems (consolidated for UI):", boqItems)
      console.log("Payload being sent to backend:", JSON.stringify(saveRequest, null, 2))
      // --- END DEBUGGING LOGS ---

      await projectService.saveProjectPlans(project.id, saveRequest)
      onSave(saveRequest) // Pass the saved data structure
    } catch (error) {
      console.error("Error saving project initiation plan:", error)
      setError("Failed to save project initiation plan")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !boqItems.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-lg bg-white p-6">
          <div className="my-8 flex justify-center">
            <div className="relative h-12 w-12">
              <div className="absolute left-0 top-0 h-full w-full animate-pulse rounded-full border-4 border-gray-200"></div>
              <div className="absolute left-0 top-0 h-full w-full animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-lg bg-white p-4 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">Project Initiation Plan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-red-600">{error}</div>}

        {/* Project Details */}
        <div className="mb-6 rounded-lg bg-blue-50 p-4 shadow-sm">
          <h3 className="mb-2 font-semibold text-blue-800">Project Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm text-blue-700">Project Name</label>
              <div className="font-medium text-gray-900">{project.project_name}</div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-blue-700">Project ID</label>
              <div className="font-medium text-gray-900">{project.lead?.lead_code || "N/A"}</div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-blue-700">Initiation Date</label>
              <div className="font-medium text-gray-900">{formatDate(projectInitDate)}</div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-blue-700">No of Weeks</label>
              <div className="font-medium text-gray-900">{numWeeks}</div>
            </div>
          </div>
        </div>

        {/* Main Content - Planning Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Product Details
                </th>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <div className="flex items-center">
                    <Calendar className="mr-1 text-gray-600" size={16} />
                    Installation Plan
                  </div>
                </th>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <div className="flex items-center">
                    <Package className="mr-1 text-gray-600" size={16} />
                    Procurement Plan
                  </div>
                </th>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <div className="flex items-center">
                    <Truck className="mr-1 text-gray-600" size={16} />
                    Dispatch Plan
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {boqItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-gray-500">
                    No BOQ items found. Please add items to the BOQ first.
                  </td>
                </tr>
              ) : (
                boqItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {/* Product Column */}
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-xs text-gray-500">Quantity: {item.quantity}</div>
                      <div className="text-xs text-gray-500">Category: {item.mainCategory}</div>
                      <div className="text-xs font-semibold text-purple-700">{item.type}</div>
                    </td>
                    {/* Installation Plan Column (Disabled) */}
                    <td className="px-4 py-4 align-top">
                      <select
                        value={installationPlan[item.id] || ""}
                        onChange={(e) => handleInstallationChange(item.id, e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        disabled // Disabled as per request
                      >
                        <option value="">Select Week</option>
                        {weeks.map((week) => (
                          <option key={week.weekNumber} value={week.weekNumber}>
                            {week.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Procurement Plan Column (Disabled) */}
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Date</label>
                          <input
                            type="date"
                            value={procurementPlan[item.id]?.date || ""} // Directly use YYYY-MM-DD string
                            onChange={(e) => handleProcurementDateChange(item.id, e.target.value)}
                            className="block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none" // Added disabled styling
                            disabled // Disabled as per request
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Lead Time (days)</label>
                          <input
                            type="number"
                            min="0"
                            value={procurementPlan[item.id]?.leadTime || ""}
                            onChange={(e) => handleProcurementLeadTimeChange(item.id, e.target.value)}
                            className="block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none" // Added disabled styling
                            disabled // Disabled as per request
                          />
                        </div>
                      </div>
                    </td>
                    {/* Dispatch Plan Column (Editable with History) */}
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Date</label>
                          <input
                            type="date"
                            value={dispatchPlan[item.id]?.date || ""} // Directly use YYYY-MM-DD string
                            // onChange={(e) => handleDispatchDateChange(item.id, e.target.value)} // Re-enable if dispatch date is editable
                            className="block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none"
                            disabled // Disabled as per request
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Lead Time (days)</label>
                          <input
                            type="number"
                            min="0"
                            value={dispatchPlan[item.id]?.leadTime || ""}
                            // onChange={(e) => handleDispatchLeadTimeChange(item.id, e.target.value)} // Re-enable if dispatch lead time is editable
                            className="block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none"
                            disabled // Disabled as per request
                          />
                        </div>
                        {/* Dispatch Plan History */}
                        {dispatchHistory[item.id] && dispatchHistory[item.id].length > 0 && (
                          <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                            <h4 className="mb-1 font-semibold">History:</h4>
                            <div className="max-h-24 overflow-y-auto">
                              {dispatchHistory[item.id].map((historyItem, index) => (
                                <div
                                  key={index}
                                  className="mb-1 border-b border-gray-200 pb-1 last:mb-0 last:border-b-0"
                                >
                                  <div>
                                    Date: {formatDate(historyItem.planDate)} (Lead: {historyItem.leadTime} days)
                                  </div>
                                  <div>
                                    Version: {historyItem.version} (Recorded:{" "}
                                    {formatDate(new Date(historyItem.recordedAt))}
                                    {` ${new Date(historyItem.recordedAt).toLocaleTimeString()}`})
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Actions */}
        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Plan"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectDispatch
