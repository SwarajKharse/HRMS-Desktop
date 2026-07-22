"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"
import { FiEdit2, FiAlertCircle, FiCheck, FiChevronRight, FiFileText, FiTruck, FiTrendingUp, FiBarChart2 } from "react-icons/fi"
import { projectService } from "../../services/projectService"
import ProjectLeadDetails from "./ProjectLeadDetails"
import BOQEditComponent from "./BOQEditComponent"
import DCHistoryModal from "./DCHistoryModal"
import ProjectInitiationIntegration from "./ProjectInitiationIntegration"
import ProjectSummary from "./ProjectSummary"
import ProjectProgressModal from "./ProjectProgressModal"
import { useHighlightTarget } from "../../hooks/useHighlightTarget"
import { getErrorMessage } from "../../utils/errorUtils"

function NewProjects() {
  const navigate = useNavigate()
  useHighlightTarget()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unassignedleads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateSearchQuery, setDateSearchQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showBOQEdit, setShowBOQEdit] = useState(false)
  const [showDCHistory, setShowDCHistory] = useState(false)
  const [dcHistoryProject, setDcHistoryProject] = useState(null)
  const [showProgress, setShowProgress] = useState(false)
  const [progressProject, setProgressProject] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [progressMap, setProgressMap] = useState({})
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showTerminationForm, setShowTerminationForm] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryProjectId, setSummaryProjectId] = useState(null)
  const [showAssignmentWarning, setShowAssignmentWarning] = useState(false)
  const [pendingRequisitionProjectIds, setPendingRequisitionProjectIds] = useState(() => new Set())
  const { user } = useAuth()
  var userId = ""

  if (user) {
    userId = user.userId
  }

  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [sourcelist, setSourcelist] = useState([])
  const [typelist, setTypelist] = useState([])
  const [producttypelist, setProductTypelist] = useState([])

  // Mobile filter state
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Add new state variables for lead type and source filters
  const [typeSearchQuery, setTypeSearchQuery] = useState("")
  const [sourceSearchQuery, setSourceSearchQuery] = useState("")

  // Applied filters state (what's actually sent to backend)
  const [appliedFilters, setAppliedFilters] = useState({
    leadCode: "",
    fromDate: "",
    toDate: "",
    assignedSse: "",
    assignedBdm: "",
    priority: "",
    leadType: "",
    leadSource: "",
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const leadsPerPage = 30

  // State for expanded rows on mobile
  const [expandedRows, setExpandedRows] = useState({})
  const [search, setSearch] = useState("")

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const page = currentPage - 1

      const projectData = await projectService.getNewProjects(page, leadsPerPage, search)

      setLeads(projectData.content || [])
      setTotalPages(projectData.totalPages || 1)
      setTotalResults(projectData.totalResults || 0)
      setLoading(false)

      console.log(unassignedleads)
    } catch (error) {
      setError(getErrorMessage(error, "Failed to fetch projects"))
      setLoading(false)
    }
  }, [currentPage, leadsPerPage, user?.orgId, userId, search])

  useEffect(() => {
    fetchLeads()
    if (sourcelist.length === 0) {
      fetchSourceTypeData()
    }
  }, [fetchLeads, sourcelist.length])

  useEffect(() => {
    projectService.getAllProjectsProgressSummary()
      .then((data) => {
        const map = {}
        data.forEach((d) => { map[d.projectId] = d.overallProgressPercent })
        setProgressMap(map)
      })
      .catch((err) => console.error("Failed to load progress summary:", err))
  }, [])

  // BOQ button blinks while a project has a requisition awaiting PM approval —
  // independent of any notification click, and clears once it's approved/rejected.
  useEffect(() => {
    const fetchPendingRequisitions = () => {
      projectService.getAllRequisitions()
        .then((data) => {
          const ids = new Set(
            (Array.isArray(data) ? data : [])
              .filter((r) => (r.status || "").toUpperCase() === "PENDING")
              .map((r) => r.projectId)
          )
          setPendingRequisitionProjectIds(ids)
        })
        .catch((err) => console.error("Failed to load pending requisitions:", err))
    }
    fetchPendingRequisitions()
    const interval = setInterval(fetchPendingRequisitions, 15000)
    return () => clearInterval(interval)
  }, [])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
    }, [searchQuery, dateSearchQuery, typeSearchQuery, sourceSearchQuery, search])

  const fetchSourceTypeData = async () => {
    try {
      const [leadSource, leadType, leadProductType] = await Promise.all([
        leadService.getLeadSourceList(),
        leadService.getLeadTypeList(),
        leadService.getLeadProductTypeList(),
      ])
      setSourcelist(leadSource)
      setTypelist(leadType)
      setProductTypelist(leadProductType)
    } catch (err) {
      setError(getErrorMessage(err, "Error while fetching data"))
      console.error(err)
    }
  }

  const getProgressRowStyle = (projectId) => {
    const pct = progressMap[projectId] || 0
    return { background: `linear-gradient(to right, #86efac ${pct}%, #ffffff ${pct}%)` }
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    // Scroll to top on mobile when changing pages
    if (window.innerWidth < 768) {
      window.scrollTo(0, 0)
    }
  }

  const handleRowClick = (lead) => {
    // Toggle expanded state for mobile view
    setExpandedRows((prev) => ({
      ...prev,
      [lead.id]: !prev[lead.id],
    }))
  }

  const handleAddEmployee = async () => {
    try {
      await fetchLeads()
      setShowForm(false)
      setSelectedLead(null)
    } catch (error) {
      setError(getErrorMessage(error, "Failed to add employee"))
    }
  }

  // BOQ/Progress/DC History/Summary all assume a PM and SE are already assigned to
  // the project; block those actions with a popup instead until both are set (the
  // Edit button is exempt, since that's where PM/SE actually get assigned).
  // SE assignment is the multi-select siteEngineers list (project.siteEngineer, the
  // singular field, is always null — assignment goes through the plural endpoint).
  const hasRequiredAssignments = (project) =>
    Boolean(project.projectManager) && Array.isArray(project.siteEngineers) && project.siteEngineers.length > 0

  const guardAssignedAction = (e, project, action) => {
    if (!hasRequiredAssignments(project)) {
      e.stopPropagation()
      setShowAssignmentWarning(true)
      return
    }
    action(e)
  }

  const handleSummary = (e, project) => {
    e.stopPropagation()
    setSummaryProjectId(project.id)
    setShowSummary(true)
  }

  const handleEdit = (e, id) => {
    e.stopPropagation()
    const allLeads = [...new Set(unassignedleads.map((tag) => tag.lead))]
    //const lead = allLeads.find((emp) => emp.id === id)

    
    console.log("ID is ============="+ id)

    setSelectedLead(id)
    setShowForm(true)
  }

  const handleBOQEdit = async (e, project) => {
    e.stopPropagation()
    try {
      setLoading(true)
      console.log("Fetching BOQ data for project:", project.id)

      // Always fetch fresh BOQ data from the database
      const boqData = await projectService.getBOQByProjectId(project.id)
      console.log("Fetched BOQ data:", boqData)

      setSelectedProject({
        ...project,
        boq: boqData || { items: [] },
      })
      setShowBOQEdit(true)
    } catch (error) {
      console.error("Error fetching BOQ data:", error)
      // If no BOQ exists or error occurs, create empty structure
      setSelectedProject({
        ...project,
        boq: {
          items: [],
        },
      })
      setShowBOQEdit(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBOQSave = async (boqData) => {
    try {
      setLoading(true)
      console.log("Saving BOQ data:", boqData)

      // Save the BOQ data
      await projectService.saveBOQWithMaterialRequisition(selectedProject.id, boqData)

      setSuccessMessage("BOQ saved successfully!")

      // Close the BOQ edit modal
      setShowBOQEdit(false)

      // Clear the selected project
      setSelectedProject(null)

      // Refresh the projects list to get updated data
      await fetchLeads()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error saving BOQ:", error)
      setError(getErrorMessage(error, "Failed to save BOQ."))
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (type, value) => {
    if (type === "priority") {
      setSearchQuery(value)
    } else if (type === "date") {
      setDateSearchQuery(value)
    } else if (type === "type") {
      setTypeSearchQuery(value)
    } else if (type === "source") {
      setSourceSearchQuery(value)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setDateSearchQuery("")
    setTypeSearchQuery("")
    setSourceSearchQuery("")
    setCurrentPage(1)
    setShowMobileFilters(false)
  }

  const Capitalize = (str) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const getLeadType = (leadTypeId) => {
    const type = typelist.find((type) => type.id === leadTypeId)
    return type ? type.label : ""
  }

  const fetchDateFromApi = (apiDate) => {
    if (!apiDate) return false

    // Create date from input value
    var inputDate = new Date(apiDate)
    var todaysDate = new Date()

    if (inputDate.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
      return true
    }
    return false
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading && unassignedleads.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-3 md:p-4 rounded-lg flex items-center gap-2 md:gap-3 border border-red-100 mx-2 md:mx-0"
        >
          <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="text-sm md:font-medium">{error}</span>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 text-green-600 p-3 md:p-4 rounded-lg border border-green-100 flex items-center shadow-sm mx-2 md:mx-0"
        >
          <FiCheck className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
          <span className="text-sm md:font-medium">{successMessage}</span>
        </motion.div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mx-2 md:mx-0">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">New Projects</h2>
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project code or name..."
            className="w-full h-11 rounded-lg border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading && (
          <div className="flex justify-center my-4">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Project ID", "Project Name","Project Initiation", "Scope of Work", "Summary", "Actions"].filter(Boolean).map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unassignedleads.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium">
                        No projects found
                      </td>
                    </tr>
                  ) : (
                    unassignedleads.map((project) => (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={getProgressRowStyle(project.id)}
                        className="cursor-pointer transition-colors group"
                        onClick={() => handleRowClick(project)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {<span>{project.lead.lead_code}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-900">{project.project_name}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {/* <button
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                              onClick={(e) => handleBOQEdit(e, project)}
                              title="Edit BOQ"
                            >
                              Project Initiation
                            </button> */}
                            <ProjectInitiationIntegration project={project} />
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <button
                              data-highlight-id={`boq-btn-${project.id}`}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors text-sm font-medium ${
                                pendingRequisitionProjectIds.has(project.id)
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200 pending-blink"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              }`}
                              onClick={(e) => guardAssignedAction(e, project, (ev) => handleBOQEdit(ev, project))}
                              title={pendingRequisitionProjectIds.has(project.id) ? "Requisition pending your approval" : "Edit BOQ"}
                            >
                              <FiFileText size={14} /> BOQ
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium"
                              onClick={(e) => guardAssignedAction(e, project, () => { setDcHistoryProject(project); setShowDCHistory(true) })}
                              title="DC History"
                            >
                              <FiTruck size={14} /> DC History
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                              onClick={(e) => guardAssignedAction(e, project, () => { setProgressProject(project); setShowProgress(true) })}
                              title="Project Progress"
                            >
                              <FiTrendingUp size={14} /> Progress: {Math.round(progressMap[project.id] || 0)}%
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium"
                            onClick={(e) => guardAssignedAction(e, project, (ev) => handleSummary(ev, project))}
                            title="View Summary"
                          >
                            <FiBarChart2 size={14} /> Summary
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <button
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                              onClick={(e) => handleEdit(e, project.lead.id)}
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
              <div className="md:hidden">
                {unassignedleads.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 font-medium">No projects found</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {unassignedleads.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={getProgressRowStyle(project.id)}
                        className="p-4 relative"
                      >
                        {/* Edit - standalone pen icon, top-right corner */}
                        <button
                          className="absolute top-3 right-3 text-gray-400 active:text-indigo-600"
                          onClick={(e) => handleEdit(e, project.lead.id)}
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>

                        {/* Title */}
                        <div className="mb-3 pr-8">
                          <div className="text-base font-semibold text-gray-900">{project.lead?.lead_code || "N/A"}</div>
                          <div className="text-sm text-gray-600 mt-0.5">{project.project_name}</div>
                        </div>

                        {/* Actions – full-width, finger-sized */}
                          <div className="grid grid-cols-5 gap-1">
                            <div onClick={(e) => e.stopPropagation()}>
                              <ProjectInitiationIntegration project={project} compact />
                            </div>
                            <button
                              data-highlight-id={`boq-btn-${project.id}`}
                              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg ${
                                pendingRequisitionProjectIds.has(project.id)
                                  ? "bg-amber-50 text-amber-800 active:bg-amber-100 pending-blink"
                                  : "bg-blue-50 text-blue-700 active:bg-blue-100"
                              }`}
                              onClick={(e) => guardAssignedAction(e, project, (ev) => handleBOQEdit(ev, project))}
                            >
                              <FiFileText size={16} />
                              <span className="text-[10px] font-medium">BOQ</span>
                            </button>
                            <button
                              className="flex flex-col items-center justify-center gap-0.5 py-2 bg-purple-50 text-purple-700 rounded-lg active:bg-purple-100"
                              onClick={(e) => guardAssignedAction(e, project, () => { setDcHistoryProject(project); setShowDCHistory(true) })}
                            >
                              <FiTruck size={16} />
                              <span className="text-[10px] font-medium">DC</span>
                            </button>
                            <button
                              className="flex flex-col items-center justify-center gap-0.5 py-2 bg-green-50 text-green-700 rounded-lg active:bg-green-100"
                              onClick={(e) => guardAssignedAction(e, project, () => { setProgressProject(project); setShowProgress(true) })}
                            >
                              <FiTrendingUp size={16} />
                              <span className="text-[10px] font-medium">Progress</span>
                            </button>
                            <button
                              className="flex flex-col items-center justify-center gap-0.5 py-2 bg-indigo-50 text-indigo-700 rounded-lg active:bg-indigo-100"
                              onClick={(e) => guardAssignedAction(e, project, () => { setSummaryProjectId(project.id); setShowSummary(true) })}
                            >
                              <FiBarChart2 size={16} />
                              <span className="text-[10px] font-medium">Summary</span>
                            </button>
                          </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Prev
            </button>

            {/* Mobile pagination - just show current/total */}
            <div className="md:hidden px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </div>

            {/* Desktop pagination - show page numbers */}
            <div className="hidden md:flex">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show at most 5 page buttons
                let pageNum
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  // If near the start, show first 5 pages
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  // If near the end, show last 5 pages
                  pageNum = totalPages - 4 + i
                } else {
                  // Otherwise show 2 before and 2 after current page
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`px-3 py-1 rounded-md border text-sm ${
                      currentPage === pageNum ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && <span className="px-2">...</span>}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={loading}
                  className={`px-3 py-1 rounded-md border text-sm bg-white text-gray-600`}
                >
                  {totalPages}
                </button>
              )}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        <div className="mt-2 text-xs md:text-sm text-gray-500 text-center">
          Showing {unassignedleads.length > 0 ? (currentPage - 1) * leadsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * leadsPerPage, totalResults)} of {totalResults} projects
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <ProjectLeadDetails
            leadId={selectedLead}
            activeTab="salestl-won-leads"
            onClose={() => {
              setShowForm(false)
              setSelectedLead(null)
            }}
            onSubmit={handleAddEmployee}
          />
        )}

        {showBOQEdit && selectedProject && (
          <BOQEditComponent
            projectId={selectedProject.id}
            projectName={selectedProject.project_name}
            existingBOQ={selectedProject.boq}
            onSave={handleBOQSave}
            onClose={() => {
              setShowBOQEdit(false)
              setSelectedProject(null)
            }}
          />
        )}
        {showDCHistory && dcHistoryProject && (
          <DCHistoryModal
            projectId={dcHistoryProject.id}
            projectName={dcHistoryProject.project_name}
            isOpen={true}
            currentUserId={userId}
            onClose={() => { setShowDCHistory(false); setDcHistoryProject(null) }}
          />
        )}
        {showProgress && progressProject && (
          <ProjectProgressModal
            projectId={progressProject.id}
            projectName={progressProject.project_name}
            isOpen={showProgress}
            onClose={() => setShowProgress(false)}
          />
        )}
        {showSummary && summaryProjectId && (
          <ProjectSummary
            projectId={summaryProjectId}
            onClose={() => {
              setShowSummary(false)
              setSummaryProjectId(null)
            }}
          />
        )}
      </AnimatePresence>

      {showAssignmentWarning && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowAssignmentWarning(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Assignment Required</h3>
              <button
                onClick={() => setShowAssignmentWarning(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Please assign a Project Manager and Site Engineer to this project before performing this action. Use the edit (pencil) icon on this row to assign them.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAssignmentWarning(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewProjects