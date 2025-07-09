"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiCalendar, FiTruck, FiPackage } from "react-icons/fi"
import { projectService } from "../../services/projectService"

function ProjectInitiation({ project, onClose, onSave }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [boqItems, setBoqItems] = useState([])
  const [weeks, setWeeks] = useState([])
  const [projectInitDate, setProjectInitDate] = useState(new Date())
  const [numWeeks, setNumWeeks] = useState(12) // Default to 12 weeks
  const [installationPlan, setInstallationPlan] = useState({})
  const [procurementPlan, setProcurementPlan] = useState({})
  const [dispatchPlan, setDispatchPlan] = useState({})

  // Fetch BOQ items and project details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch BOQ data
        const boqData = await projectService.getBOQByProjectId(project.id)
        setBoqItems(boqData?.items || [])

        // Fetch project details to get initiation date and number of weeks
        const projectDetails = await projectService.getProjectDetails(project.id)

        // Set project initiation date (use current date if not available)
        const initDate = projectDetails?.projectInitiationDate
          ? new Date(projectDetails.projectInitiationDate)
          : new Date()
          setProjectInitDate(initDate)
        
        // Set number of weeks (use default if not available)
        setNumWeeks(projectDetails?.numberOfWeeks || 12)

        console.log("Initiation date  "+initDate+"   "+projectDetails?.number_of_weeks)
          
        // Generate weeks based on project initiation date
        generateWeeks(initDate, projectDetails?.numberOfWeeks || 12)

        // Initialize empty plans for each BOQ item
        initializePlans(boqData?.items || [])

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load project data")
        setLoading(false)
      }
    }

    fetchData()
  }, [project.id])

  // Generate array of weeks based on project initiation date
  const generateWeeks = (startDate, numberOfWeeks) => {
    const weeksList = []
    const start = new Date(startDate)

    for (let i = 0; i < numberOfWeeks; i++) {
      const weekStart = new Date(start.getDate()+1)
      weekStart.setDate(start.getDate() + i * 7)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      weeksList.push({
        weekNumber: i + 1,
        startDate: weekStart,
        endDate: weekEnd,
        label: `Week ${i + 1} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
      })
    }

    setWeeks(weeksList)
  }

  // Initialize empty plans for each BOQ item
  const initializePlans = (items) => {
    const installationInit = {}
    const procurementInit = {}
    const dispatchInit = {}

    items.forEach((item) => {
      installationInit[item.id] = null
      procurementInit[item.id] = {
        date: null,
        leadTime: 7, // Default lead time of 7 days
      }
      dispatchInit[item.id] = {
        date: null,
        leadTime: 3, // Default lead time of 3 days
      }
    })

    setInstallationPlan(installationInit)
    setProcurementPlan(procurementInit)
    setDispatchPlan(dispatchInit)
  }

  // Format date to display format
  const formatDate = (date) => {
    if (!date) return ""
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

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
      updateDispatchDate(itemId, procurementDate, procurementPlan[itemId]?.leadTime || 7)
    }
  }

  // Handle procurement date change
  const handleProcurementDateChange = (itemId, date) => {
    setProcurementPlan((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        date: new Date(date),
      },
    }))

    // Update dispatch date when procurement date changes
    updateDispatchDate(itemId, new Date(date), procurementPlan[itemId]?.leadTime || 7)
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
  const updateDispatchDate = (itemId, procurementDate, leadTimeDays) => {
    if (!procurementDate) return

    const dispatchDate = new Date(procurementDate)
    dispatchDate.setDate(dispatchDate.getDate() + leadTimeDays)

    setDispatchPlan((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        date: dispatchDate,
      },
    }))
  }

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
        installationPlan,
        procurementPlan,
        dispatchPlan,
      }

      await projectService.saveProjectInitiationPlan(planData)
      onSave(planData)
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
            <div>
              <label className="block text-sm text-gray-600 mb-1">Initiation Date</label>
              <div className="font-medium">{formatDate(projectInitDate)}</div>
            </div>
                      
            <div>
              <label className="block text-sm text-gray-600 mb-1">No of Weeks</label>
              <div className="font-medium">{numWeeks}</div>
            </div>
          </div>
        </div>

        {/* Main Content - Planning Table */}
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
                boqItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {/* Product Column */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-xs text-gray-500">{item.product_code}</div>
                      <div className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</div>
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
                              dispatchPlan[item.id]?.date ? dispatchPlan[item.id].date.toISOString().split("T")[0] : ""
                            }
                            disabled
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {dispatchPlan[item.id]?.date ? formatDate(dispatchPlan[item.id].date) : "Auto-calculated"}
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
                          />
                        </div>
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
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
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
