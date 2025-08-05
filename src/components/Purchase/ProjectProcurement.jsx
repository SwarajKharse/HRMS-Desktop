"use client"

import { useState, useEffect } from "react"
import { Calendar, Truck, Package, X } from "lucide-react"
import { projectService } from "../../services/projectService"

function ProjectProcurement({ project, onClose, onSave }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [boqItems, setBoqItems] = useState([])
  const [weeks, setWeeks] = useState([])
  const [projectInitDate, setProjectInitDate] = useState(null)
  const [numWeeks, setNumWeeks] = useState(null)
  const [installationPlan, setInstallationPlan] = useState({})
  const [procurementPlan, setProcurementPlan] = useState({})
  const [dispatchPlan, setDispatchPlan] = useState({})
  const [procurementHistory, setProcurementHistory] = useState({})

  // New state for conditional rendering of initial setup form
  const [showInitialSetup, setShowInitialSetup] = useState(true)
  // Temporary states for initial date and weeks input
  const [tempProjectInitDate, setTempProjectInitDate] = useState("")
  const [tempNumWeeks, setTempNumWeeks] = useState(12)

  // State to track if the project prop itself is valid
  const [isProjectPropValid, setIsProjectPropValid] = useState(false)

  // Helper to format Date object to YYYY-MM-DD string for input type="date"
  const toISODateString = (date) => {
    if (!date) return ""
    const d = date instanceof Date ? date : new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, "0")
    const day = d.getDate().toString().padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Format date to display format (e.g., "Jul 23, 2025")
  const formatDate = (date) => {
    if (!date) return ""
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
      if (!project || !project.id) {
        setError("Error: Project data is incomplete. Project ID is missing.")
        setLoading(false)
        setIsProjectPropValid(false)
        setShowInitialSetup(false)
        return
      }

      setIsProjectPropValid(true)
      setLoading(true)
      setError(null)

      try {
        const projectDetails = await projectService.getProjectDetails(project.id)

        const initDateFromBackend = projectDetails?.projectInitiationDate || null
        const numWeeksFromBackend = projectDetails?.numberOfWeeks || null

        if (!initDateFromBackend || numWeeksFromBackend === null) {
          setShowInitialSetup(true)
          setLoading(false)
          setTempProjectInitDate(initDateFromBackend ? toISODateString(new Date(initDateFromBackend)) : "")
          setTempNumWeeks(numWeeksFromBackend !== null ? String(numWeeksFromBackend) : "")
          return
        }

        setProjectInitDate(new Date(initDateFromBackend))
        setNumWeeks(numWeeksFromBackend)
        generateWeeks(new Date(initDateFromBackend), numWeeksFromBackend)
        setShowInitialSetup(false)

        const boqData = await projectService.getBOQByProjectId(project.id)
        const existingPlans = await projectService.getProjectPlansByProjectId(project.id)
        const historyData = await projectService.getProjectPlanHistory(project.id, "PROCUREMENT")

        const combinedItems = []
        ;(boqData.items || []).forEach((item) => {
          combinedItems.push({
            id: `boq-${item.id}`,
            boqItemId: item.id,
            boqCategoryItemId: null,
            productName: item.product?.productName || "N/A",
            quantity: item.totalQty,
            mainCategory: item.product?.categoryId?.label || "N/A",
            type: "Billable",
            originalItem: item,
          })
          ;(item.nonBillableItems || []).forEach((nestedItem) => {
            combinedItems.push({
              id: `cat-${nestedItem.id}`,
              boqItemId: null,
              boqCategoryItemId: nestedItem.id,
              productName: nestedItem.productName || nestedItem.make || "N/A",
              quantity: nestedItem.qty,
              mainCategory: "Non-Billable",
              type: "Non-Billable",
              originalItem: nestedItem,
            })
          })
          ;(item.skillSetItems || []).forEach((nestedItem) => {
            combinedItems.push({
              id: `cat-${nestedItem.id}`,
              boqItemId: null,
              boqCategoryItemId: nestedItem.id,
              productName: nestedItem.productName || "N/A",
              quantity: nestedItem.qty,
              mainCategory: nestedItem.categoryId?.label || "Skillset",
              type: "Skillset",
              originalItem: nestedItem,
            })
          })
          ;(item.toolsItems || []).forEach((nestedItem) => {
            combinedItems.push({
              id: `cat-${nestedItem.id}`,
              boqItemId: null,
              boqCategoryItemId: nestedItem.id,
              productName: nestedItem.productName || "N/A",
              quantity: nestedItem.qty,
              mainCategory: nestedItem.categoryId?.label || "Tool",
              type: "Tool",
              originalItem: nestedItem,
            })
          })
        })
        setBoqItems(combinedItems)

        const installationInit = {}
        const procurementInit = {}
        const dispatchInit = {}
        if (existingPlans && Array.isArray(existingPlans)) {
          existingPlans.forEach((planItem) => {
            const key = planItem.boqItemId ? `boq-${planItem.boqItemId}` : `cat-${planItem.boqCategoryItemId}`
            switch (planItem.planType) {
              case "INSTALLATION":
                installationInit[key] = planItem.weekNumber
                break
              case "PROCUREMENT":
                procurementInit[key] = {
                  date: planItem.planDate || null,
                  leadTime: planItem.leadTime || 0,
                }
                break
              case "DISPATCH":
                dispatchInit[key] = {
                  date: planItem.planDate || null,
                  leadTime: planItem.leadTime || 0,
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

        const procurementHistoryMap = {}
        if (historyData && Array.isArray(historyData)) {
          historyData.forEach((historyItem) => {
            if (historyItem.planType === "PROCUREMENT") {
              const key = historyItem.boqItemId
                ? `boq-${historyItem.boqItemId}`
                : `cat-${historyItem.boqCategoryItemId}`
              if (!procurementHistoryMap[key]) {
                procurementHistoryMap[key] = []
              }
              procurementHistoryMap[key].push(historyItem)
            }
          })
          Object.keys(procurementHistoryMap).forEach((key) => {
            procurementHistoryMap[key].sort(
              (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
            )
          })
        }
        setProcurementHistory(procurementHistoryMap)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load project data. Please ensure the project exists and try again.")
        setLoading(false)
      }
    }
    fetchData()
  }, [project]) // Updated dependency to use the entire project object

  // Handle initial setup form submission
  const handleInitialSetupSubmit = async () => {
    if (!isProjectPropValid) {
      setError("Cannot proceed: Project ID is missing.")
      return
    }
    if (!tempProjectInitDate || !tempNumWeeks || Number.parseInt(tempNumWeeks) <= 0) {
      setError("Please enter a valid project initiation date and a positive number of weeks.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const updatedProjectDetails = await projectService.updateProjectDetails(project.id, {
        projectInitiationDate: tempProjectInitDate,
        numberOfWeeks: Number.parseInt(tempNumWeeks),
      })

      setProjectInitDate(new Date(updatedProjectDetails.projectInitiationDate))
      setNumWeeks(updatedProjectDetails.numberOfWeeks)
      generateWeeks(new Date(updatedProjectDetails.projectInitiationDate), updatedProjectDetails.numberOfWeeks)
      setShowInitialSetup(false)

      const boqData = await projectService.getBOQByProjectId(project.id)
      const existingPlans = await projectService.getProjectPlansByProjectId(project.id)
      const historyData = await projectService.getProjectPlanHistory(project.id, "PROCUREMENT")

      const combinedItems = []
      ;(boqData.items || []).forEach((item) => {
        combinedItems.push({
          id: `boq-${item.id}`,
          boqItemId: item.id,
          boqCategoryItemId: null,
          productName: item.product?.productName || "N/A",
          quantity: item.totalQty,
          mainCategory: item.product?.categoryId?.label || "N/A",
          type: "Billable",
          originalItem: item,
        })
        ;(item.nonBillableItems || []).forEach((nestedItem) => {
          combinedItems.push({
            id: `cat-${nestedItem.id}`,
            boqItemId: null,
            boqCategoryItemId: nestedItem.id,
            productName: nestedItem.productName || nestedItem.make || "N/A",
            quantity: nestedItem.qty,
            mainCategory: "Non-Billable",
            type: "Non-Billable",
            originalItem: nestedItem,
          })
        })
        ;(item.skillSetItems || []).forEach((nestedItem) => {
          combinedItems.push({
            id: `cat-${nestedItem.id}`,
            boqItemId: null,
            boqCategoryItemId: nestedItem.id,
            productName: nestedItem.productName || "N/A",
            quantity: nestedItem.qty,
            mainCategory: nestedItem.categoryId?.label || "Skillset",
            type: "Skillset",
            originalItem: nestedItem,
          })
        })
        ;(item.toolsItems || []).forEach((nestedItem) => {
          combinedItems.push({
            id: `cat-${nestedItem.id}`,
            boqItemId: null,
            boqCategoryItemId: nestedItem.id,
            productName: nestedItem.productName || "N/A",
            quantity: nestedItem.qty,
            mainCategory: nestedItem.categoryId?.label || "Tool",
            type: "Tool",
            originalItem: nestedItem,
          })
        })
      })
      setBoqItems(combinedItems)

      const installationInit = {}
      const procurementInit = {}
      const dispatchInit = {}
      if (existingPlans && Array.isArray(existingPlans)) {
        existingPlans.forEach((planItem) => {
          const key = planItem.boqItemId ? `boq-${planItem.boqItemId}` : `cat-${planItem.boqCategoryItemId}`
          switch (planItem.planType) {
            case "INSTALLATION":
              installationInit[key] = planItem.weekNumber
              break
            case "PROCUREMENT":
              procurementInit[key] = {
                date: planItem.planDate || null,
                leadTime: planItem.leadTime || 0,
              }
              break
            case "DISPATCH":
              dispatchInit[key] = {
                date: planItem.planDate || null,
                leadTime: planItem.leadTime || 0,
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

      const procurementHistoryMap = {}
      if (historyData && Array.isArray(historyData)) {
        historyData.forEach((historyItem) => {
          if (historyItem.planType === "PROCUREMENT") {
            const key = historyItem.boqItemId ? `boq-${historyItem.boqItemId}` : `cat-${historyItem.boqCategoryItemId}`
            if (!procurementHistoryMap[key]) {
              procurementHistoryMap[key] = []
            }
            procurementHistoryMap[key].push(historyItem)
          }
        })
        Object.keys(procurementHistoryMap).forEach((key) => {
          procurementHistoryMap[key].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
        })
      }
      setProcurementHistory(procurementHistoryMap)

      onSave({
        ...project,
        projectInitiationDate: updatedProjectDetails.projectInitiationDate,
        numberOfWeeks: updatedProjectDetails.numberOfWeeks,
      })
    } catch (err) {
      console.error("Error saving initial project details:", err)
      setError(err.message || "Failed to save initial project details.")
    } finally {
      setLoading(false)
    }
  }

  const handleInstallationChange = (itemKey, weekNumber) => {
    setInstallationPlan((prev) => ({
      ...prev,
      [itemKey]: Number.parseInt(weekNumber),
    }))
    const selectedWeek = weeks.find((week) => week.weekNumber === Number.parseInt(weekNumber))
    if (selectedWeek) {
      const procurementDateCalc = new Date(selectedWeek.startDate)
      const newProcurementDateString = toISODateString(procurementDateCalc)
      setProcurementPlan((prev) => {
        const newProcurementPlan = {
          ...prev,
          [itemKey]: {
            ...prev[itemKey],
            date: newProcurementDateString,
          },
        }
        updateDispatchDate(itemKey, procurementDateCalc, newProcurementPlan[itemKey]?.leadTime || 0)
        return newProcurementPlan
      })
    } else {
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

  const handleProcurementDateChange = (itemKey, dateString) => {
    setProcurementPlan((prev) => {
      const newProcurementPlan = {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          date: dateString,
        },
      }
      const procurementDate = dateString ? new Date(dateString) : null
      updateDispatchDate(itemKey, procurementDate, newProcurementPlan[itemKey]?.leadTime || 0)
      return newProcurementPlan
    })
  }

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
      const procurementDateString = newProcurementPlan[itemKey]?.date
      const procurementDate = procurementDateString ? new Date(procurementDateString) : null
      updateDispatchDate(itemKey, procurementDate, newLeadTime)
      return newProcurementPlan
    })
  }

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
        date: newDispatchDateString,
      },
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const plansToSave = []
      boqItems.forEach((item) => {
        const itemKey = item.id
        const boqItemId = item.boqItemId
        const boqCategoryItemId = item.boqCategoryItemId

        // Only save INSTALLATION and PROCUREMENT plans from this component
        if (installationPlan[itemKey] !== null && installationPlan[itemKey] !== undefined) {
          plansToSave.push({
            boqItemId: boqItemId,
            boqCategoryItemId: boqCategoryItemId,
            planType: "INSTALLATION",
            weekNumber: installationPlan[itemKey],
            planDate: null,
            leadTime: null,
          })
        }

        if (procurementPlan[itemKey]?.date) {
          plansToSave.push({
            boqItemId: boqItemId,
            boqCategoryItemId: boqCategoryItemId,
            planType: "PROCUREMENT",
            planDate: procurementPlan[itemKey].date,
            leadTime: procurementPlan[itemKey].leadTime || 0,
            weekNumber: null,
          })
        }
      })

      const saveRequest = {
        projectId: project.id,
        plans: plansToSave,
      }

      console.log("Frontend boqItems (consolidated for UI):", boqItems)
      console.log("Payload being sent to backend:", JSON.stringify(saveRequest, null, 2))

      await projectService.saveProjectPlans(project.id, saveRequest)
      onSave(saveRequest)
    } catch (error) {
      console.error("Error saving project procurement plan:", error)
      setError("Failed to save project procurement plan")
    } finally {
      setLoading(false)
    }
  }

  if (!isProjectPropValid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-white p-6 text-center shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Project</h2>
          <p className="text-gray-700 mb-6">{error || "Project data is incomplete or invalid."}</p>
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (loading && !boqItems.length && !showInitialSetup) {
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
          <h2 className="text-xl font-bold text-gray-800">Project Procurement Plan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        {/* Error Message */}
        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-red-600">{error}</div>}

        {showInitialSetup ? (
          <div className="space-y-6 p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Set Project Initiation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectInitDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Initiation Date
                </label>
                <input
                  type="date"
                  id="projectInitDate"
                  value={tempProjectInitDate}
                  onChange={(e) => setTempProjectInitDate(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="numWeeks" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Weeks
                </label>
                <input
                  type="number"
                  id="numWeeks"
                  min="1"
                  value={tempNumWeeks}
                  onChange={(e) => setTempNumWeeks(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleInitialSetupSubmit}
                disabled={loading}
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Proceed to Planning"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Project Details */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4 shadow-sm">
              <h3 className="mb-2 font-semibold text-blue-800">Project Details</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm text-blue-700">Project Name</label>
                  <div className="font-medium text-gray-900">{project.projectName || project.project_name}</div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-blue-700">Project ID</label>
                  <div className="font-medium text-gray-900">{project.lead?.lead_code || project.id || "N/A"}</div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-blue-700">Initiation Date</label>
                  <div className="font-medium text-gray-900">
                    {projectInitDate ? formatDate(projectInitDate) : "N/A"}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-blue-700">No of Weeks</label>
                  <div className="font-medium text-gray-900">{numWeeks !== null ? numWeeks : "N/A"}</div>
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
                        {/* Installation Plan Column */}
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
                        {/* Procurement Plan Column */}
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Date</label>
                              <input
                                type="date"
                                value={procurementPlan[item.id]?.date || ""}
                                onChange={(e) => handleProcurementDateChange(item.id, e.target.value)}
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Lead Time (days)</label>
                              <input
                                type="number"
                                min="0"
                                value={procurementPlan[item.id]?.leadTime || ""}
                                onChange={(e) => handleProcurementLeadTimeChange(item.id, e.target.value)}
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                              />
                            </div>
                            {/* Procurement Plan History */}
                            {procurementHistory[item.id] && procurementHistory[item.id].length > 0 && (
                              <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                                <h4 className="mb-1 font-semibold">History:</h4>
                                <div className="max-h-24 overflow-y-auto">
                                  {procurementHistory[item.id].map((historyItem, index) => (
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
                        {/* Dispatch Plan Column */}
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Date</label>
                              <input
                                type="date"
                                value={dispatchPlan[item.id]?.date || ""}
                                disabled // Disabled as per request
                                className="block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Lead Time (days)</label>
                              <input
                                type="number"
                                min="0"
                                value={dispatchPlan[item.id]?.leadTime || ""}
                                disabled // Disabled as per request
                                className="block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none"
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
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectProcurement