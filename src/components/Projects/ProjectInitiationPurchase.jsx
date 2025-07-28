"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { FiX, FiCalendar, FiTruck, FiPackage } from "react-icons/fi"
import { projectService } from "../services/projectService" // Actual import

function ProjectInitiation({ project, onClose, onSave }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [boqItems, setBoqItems] = useState([])
  const [weeks, setWeeks] = useState([])
  const [projectInitDate, setProjectInitDate] = useState("") // Stored as YYYY-MM-DD string for input type="date"
  const [numWeeks, setNumWeeks] = useState("") // Stored as string for input type="number"
  const [installationPlan, setInstallationPlan] = useState({})
  const [procurementPlan, setProcurementPlan] = useState({})
  const [dispatchPlan, setDispatchPlan] = useState({})

  // Helper to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Helper to get display details for a BOQ item, handling both BOQItem and BOQCategoryItem
  const getBoqItemDisplayDetails = useCallback((item) => {
    if (item.product) {
      // This is likely a BOQItem (billable product)
      return {
        name: item.product.productName || item.product.product_name, // Handle both cases
        code: item.product.productCode || item.product.product_code,
        quantity: item.totalQty,
      }
    } else if (item.itemName) {
      // This is likely a BOQCategoryItem (non-billable, skillset, tools)
      return {
        name: item.itemName,
        code: item.itemDescription || item.hsnCode, // Use description or HSN code
        quantity: item.qty,
      }
    }
    return { name: "N/A", code: "N/A", quantity: 0 }
  }, [])

  // Generate array of weeks based on project initiation date and number of weeks
  const generateWeeks = useCallback((startDateString, numberOfWeeks) => {
    const weeksList = []
    const startDate = new Date(startDateString)
    const numWeeksInt = Number.parseInt(numberOfWeeks, 10)

    if (!startDateString || isNaN(startDate.getTime()) || numWeeksInt <= 0) {
      setWeeks([])
      return
    }

    for (let i = 0; i < numWeeksInt; i++) {
      const weekStart = new Date(startDate) // Clone the start date for each iteration
      weekStart.setDate(startDate.getDate() + i * 7) // Add weeks
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6) // Week ends 6 days after start (making it 7 days total)
      weeksList.push({
        weekNumber: i + 1,
        startDate: weekStart,
        endDate: weekEnd,
        label: `Week ${i + 1} (${weekStart.toISOString().split("T")[0]} - ${weekEnd.toISOString().split("T")[0]})`,
      })
    }
    setWeeks(weeksList)
  }, [])

  // Initialize empty plans for each BOQ item
  const initializePlans = useCallback((items) => {
    const installationInit = {}
    const procurementInit = {}
    const dispatchInit = {}
    items.forEach((item) => {
      installationInit[item.id] = null
      procurementInit[item.id] = {
        date: null,
        leadTime: 0, // Changed default lead time to 0
      }
      dispatchInit[item.id] = {
        date: null,
        leadTime: 0, // Changed default lead time to 0
      }
    })
    setInstallationPlan(installationInit)
    setProcurementPlan(procurementInit)
    setDispatchPlan(dispatchInit)
  }, [])

  // Fetch BOQ items and project details on component mount or project ID change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch BOQ data
        const boqData = await projectService.getBOQByProjectId(project.id)
        const fetchedBoqItems = boqData?.items || []
        setBoqItems(fetchedBoqItems)

        // Fetch project details to get initiation date and number of weeks
        const projectDetails = await projectService.getProjectDetails(project.id)

        // Set project initiation date (use empty string if not available)
        const initDate = projectDetails?.projectInitiationDate || ""
        setProjectInitDate(initDate)

        // Set number of weeks (use empty string if not available)
        const numWks = projectDetails?.numberOfWeeks ? String(projectDetails.numberOfWeeks) : ""
        setNumWeeks(numWks)

        // Generate weeks based on fetched data
        generateWeeks(initDate, numWks)

        // Initialize empty plans for each BOQ item
        initializePlans(fetchedBoqItems)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load project data")
        setLoading(false)
      }
    }
    fetchData()
  }, [project.id, generateWeeks, initializePlans])

  // Recalculate weeks whenever projectInitDate or numWeeks changes
  useEffect(() => {
    generateWeeks(projectInitDate, numWeeks)
  }, [projectInitDate, numWeeks, generateWeeks])

  // Check if both project initiation date and number of weeks are set
  const canShowPlans = projectInitDate && Number.parseInt(numWeeks, 10) > 0

  // Handle installation week selection
  const handleInstallationChange = (itemId, weekNumber) => {
    setInstallationPlan((prev) => ({
      ...prev,
      [itemId]: weekNumber,
    }))
    // Auto-calculate procurement and dispatch dates based on installation week
    const selectedWeek = weeks.find((week) => week.weekNumber === Number.parseInt(weekNumber))
    if (selectedWeek) {
      // Set procurement date to 2 weeks before installation
      const procurementDate = new Date(selectedWeek.startDate)
      procurementDate.setDate(procurementDate.getDate() - 14)
      setProcurementPlan((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          date: procurementDate,
        },
      }))
      // Calculate dispatch date based on procurement date and lead time
      updateDispatchDate(itemId, procurementDate, procurementPlan[itemId]?.leadTime || 0) // Use 0 as default
    }
  }

  // Handle procurement date change
  const handleProcurementDateChange = (itemId, dateString) => {
    const newDate = dateString ? new Date(dateString) : null
    setProcurementPlan((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        date: newDate,
      },
    }))
    // Update dispatch date when procurement date changes
    updateDispatchDate(itemId, newDate, procurementPlan[itemId]?.leadTime || 0) // Use 0 as default
  }

  // Handle procurement lead time change
  const handleProcurementLeadTimeChange = (itemId, leadTime) => {
    const leadTimeDays = Number.parseInt(leadTime) || 0
    setProcurementPlan((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        leadTime: leadTimeDays,
      },
    }))
    // Update dispatch date when lead time changes
    if (procurementPlan[itemId]?.date) {
      updateDispatchDate(itemId, procurementPlan[itemId].date, leadTimeDays)
    }
  }

  // Calculate and update dispatch date based on procurement date and lead time
  const updateDispatchDate = useCallback((itemId, procurementDate, leadTimeDays) => {
    if (!procurementDate) {
      setDispatchPlan((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          date: null,
        },
      }))
      return
    }
    const dispatchDate = new Date(procurementDate)
    dispatchDate.setDate(dispatchDate.getDate() + leadTimeDays)
    setDispatchPlan((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        date: dispatchDate,
      },
    }))
  }, [])

  // Handle dispatch lead time change
  const handleDispatchLeadTimeChange = (itemId, leadTime) => {
    setDispatchPlan((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        leadTime: Number.parseInt(leadTime) || 0,
      },
    }))
  }

  // Save project initiation plan
  const handleSave = async () => {
    try {
      setLoading(true)
      const planData = {
        projectId: project.id,
        projectInitiationDate: projectInitDate, // Save the new date
        numberOfWeeks: Number.parseInt(numWeeks, 10), // Save the new number of weeks
        installationPlan,
        procurementPlan,
        dispatchPlan,
      }
      await projectService.saveProjectInitiationPlan(project.id, planData) // Pass projectId separately
      onSave(planData)
      onClose() // Close the modal after successful save
    } catch (error) {
      console.error("Error saving project initiation plan:", error)
      setError("Failed to save project initiation plan")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !boqItems.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
          <div className="flex justify-center my-8">
            <div className="relative w-12 h-12">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-4 w-full max-w-6xl max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">Project Initiation Plan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        {/* Error Message */}
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 border border-red-100">{error}</div>}
        {/* Project Details */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Project Name</label>
              <div className="font-medium">{project.project_name}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Project ID</label>
              <div className="font-medium">{project.lead?.lead_code || "N/A"}</div>
            </div>
            {/* New Project Initiation Date Field */}
            <div>
              <label htmlFor="project-initiation-date" className="block text-sm text-gray-600 mb-1">
                Initiation Date
              </label>
              <input
                id="project-initiation-date"
                type="date"
                value={projectInitDate}
                onChange={(e) => setProjectInitDate(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            {/* New Number of Weeks Field */}
            <div>
              <label htmlFor="num-weeks" className="block text-sm text-gray-600 mb-1">
                No of Weeks
              </label>
              <input
                id="num-weeks"
                type="number"
                min="1"
                value={numWeeks}
                onChange={(e) => setNumWeeks(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        {/* Main Content - Planning Table */}
        {!canShowPlans && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-4 border border-yellow-100">
            Please set the Project Initiation Date and Number of Weeks to view and edit the plans.
          </div>
        )}
        {canShowPlans && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1" />
                      Installation Plan
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                    <div className="flex items-center">
                      <FiPackage className="mr-1" />
                      Procurement Plan
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                    <div className="flex items-center">
                      <FiTruck className="mr-1" />
                      Dispatch Plan
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boqItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-6 text-center text-gray-500">
                      No BOQ items found. Please add items to the BOQ first.
                    </td>
                  </tr>
                ) : (
                  boqItems.map((item) => {
                    const displayItem = getBoqItemDisplayDetails(item)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        {/* Product Column */}
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{displayItem.name}</div>
                          <div className="text-xs text-gray-500">{displayItem.code}</div>
                          <div className="text-xs text-gray-500 mt-1">Quantity: {displayItem.quantity}</div>
                        </td>
                        {/* Installation Plan Column */}
                        <td className="px-4 py-4">
                          <select
                            value={installationPlan[item.id] || ""}
                            onChange={(e) => handleInstallationChange(item.id, e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select Week</option>
                            {weeks.map((week) => (
                              <option key={week.weekNumber} value={week.weekNumber}>
                                {week.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Procurement Plan Column */}
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Date</label>
                              <input
                                type="date"
                                value={
                                  procurementPlan[item.id]?.date
                                    ? procurementPlan[item.id].date.toISOString().split("T")[0]
                                    : ""
                                }
                                onChange={(e) => handleProcurementDateChange(item.id, e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={!canShowPlans} // Disabled if canShowPlans is false
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Lead Time (days)</label>
                              <input
                                type="number"
                                min="0"
                                value={procurementPlan[item.id]?.leadTime || ""}
                                onChange={(e) => handleProcurementLeadTimeChange(item.id, e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={!canShowPlans} // Disabled if canShowPlans is false
                              />
                            </div>
                          </div>
                        </td>
                        {/* Dispatch Plan Column */}
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Date</label>
                              <input
                                type="date"
                                value={
                                  dispatchPlan[item.id]?.date
                                    ? dispatchPlan[item.id].date.toISOString().split("T")[0]
                                    : ""
                                }
                                disabled={true} // Always disabled as it's auto-calculated
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {dispatchPlan[item.id]?.date
                                  ? formatDate(dispatchPlan[item.id].date.toISOString().split("T")[0])
                                  : "Auto-calculated"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Lead Time (days)</label>
                              <input
                                type="number"
                                min="0"
                                value={dispatchPlan[item.id]?.leadTime || ""}
                                onChange={(e) => handleDispatchLeadTimeChange(item.id, e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={!canShowPlans} // Disabled if canShowPlans is false
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer with Actions */}
        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !canShowPlans} // Disable save if loading or plans cannot be shown
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Plan"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ProjectInitiation