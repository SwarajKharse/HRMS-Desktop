"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiX } from "react-icons/fi"
import { leadService } from "../../services/leadService"
import { projectService } from "../../services/projectService"
import { useAuth } from "../../contexts/AuthContext"

function ProjectLeadDetails({ leadId, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    leadDetails: false, // Lead Details expanded by default
    projectDetails: true, // Project Details collapsed by default
  })

  const userId = user ? user.userId : ""
  const [lead, setLead] = useState(null) // Initialize with null to indicate no data yet
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true) // State to track initial data loading
  const [managerslist, setManagerslist] = useState([])
  const [seData, setSEList] = useState([])
  const [sourcelist, setSourcelist] = useState([])
  const [typelist, setTypelist] = useState([])
  const [producttypelist, setProductTypelist] = useState([])

  // Initialize projectData with a comprehensive structure
  const [projectData, setProjectData] = useState({
    projectName: "",
    projectDescription: "",
    projectBudget: "",
    projectTimeline: "",
    projectStatus: "planning",
    projectManager: "", // Will store ID
    siteEngineer: "", // Will store ID
    estimatedValue: "",
    actualValue: "",
    startDate: "",
    endDate: "",
    // Ensure employee_updatedby is always present for backend
    employee_updatedby: { id: userId },
  })

  // Effect to fetch all initial data (lead details, project details, managers, SEs)
  useEffect(() => {
    const fetchAllInitialData = async () => {
      setDataLoading(true)
      setError("")
      try {
        const [
          leadDetails,
          projectdetailsResponse, // This is the ProjectResponseDTO from backend
          leadSource,
          leadType,
          leadProductType,
          managers, // Fetched managers list
          siteEngineers, // Fetched site engineers list
        ] = await Promise.all([
          projectService.getLeadByLeadId(leadId),
          projectService.getProjectByLeadId(leadId),
          leadService.getLeadSourceList(),
          leadService.getLeadTypeList(),
          leadService.getLeadProductTypeList(),
          projectService.getProjectManagerList(),
          projectService.getSiteEngineerList(),
        ])

        setLead(leadDetails)
        setSourcelist(leadSource)
        setTypelist(leadType)
        setProductTypelist(leadProductType)
        setManagerslist(managers) // Set managers list
        setSEList(siteEngineers) // Set site engineers list

        // Initialize projectData based on fetched projectdetailsResponse
        let initialProjectManager = ""
        let initialSiteEngineer = ""
        let initialProjectName = ""
        let initialProjectDescription = ""
        let initialProjectBudget = ""
        let initialProjectTimeline = ""
        let initialProjectStatus = "planning"
        let initialEstimatedValue = ""
        let initialActualValue = ""
        let initialStartDate = ""
        let initialEndDate = ""

        if (projectdetailsResponse) {
          // If project exists, use its values
          initialProjectName = projectdetailsResponse.projectName || ""
          initialProjectDescription = projectdetailsResponse.projectDescription || ""
          initialProjectBudget = projectdetailsResponse.projectBudget || ""
          initialProjectTimeline = projectdetailsResponse.projectTimeline || ""
          initialProjectStatus = projectdetailsResponse.projectStatus || "planning"
          initialEstimatedValue = projectdetailsResponse.estimatedValue || ""
          initialActualValue = projectdetailsResponse.actualValue || ""
          initialStartDate = projectdetailsResponse.startDate || ""
          initialEndDate = projectdetailsResponse.endDate || ""

          // Map backend IDs to frontend state for dropdowns
          initialProjectManager = projectdetailsResponse.projectManagerId || ""
          initialSiteEngineer = projectdetailsResponse.siteEngineerId || ""
        }

        // Override initialProjectManager if current user is a manager and no manager is assigned
        // This logic should apply *after* trying to get it from fetched projectdetailsResponse
        if (!initialProjectManager && managers.some((manager) => manager.id === userId)) {
          initialProjectManager = userId
        }

        // Set the projectData state with all initialized values
        setProjectData({
          projectName: initialProjectName,
          projectDescription: initialProjectDescription,
          projectBudget: initialProjectBudget,
          projectTimeline: initialProjectTimeline,
          projectStatus: initialProjectStatus,
          projectManager: initialProjectManager,
          siteEngineer: initialSiteEngineer,
          estimatedValue: initialEstimatedValue,
          actualValue: initialActualValue,
          startDate: initialStartDate,
          endDate: initialEndDate,
          employee_updatedby: { id: userId }, // Always ensure this is the current user
        })
      } catch (err) {
        setError("Failed to load project details or related lists.")
        console.error(err)
        setLead(null)
        // Ensure projectData is reset to defaults or minimal on error
        setProjectData({
          projectName: "",
          projectDescription: "",
          projectBudget: "",
          projectTimeline: "",
          projectStatus: "planning",
          projectManager: "",
          siteEngineer: "",
          estimatedValue: "",
          actualValue: "",
          startDate: "",
          endDate: "",
          employee_updatedby: { id: userId },
        })
      } finally {
        setDataLoading(false)
      }
    }

    if (leadId) {
      fetchAllInitialData()
    } else {
      setDataLoading(false)
      setLead(null)
      // If no leadId, ensure projectData is also reset to defaults
      setProjectData({
        projectName: "",
        projectDescription: "",
        projectBudget: "",
        projectTimeline: "",
        projectStatus: "planning",
        projectManager: "",
        siteEngineer: "",
        estimatedValue: "",
        actualValue: "",
        startDate: "",
        endDate: "",
        employee_updatedby: { id: userId },
      })
    }
  }, [leadId, userId]) // Dependencies: leadId and userId. managerslist and seData are fetched inside.

  // REMOVED: The problematic useEffect that caused infinite updates.
  // Its logic is now integrated into the first useEffect.

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation for leadId
    if (!leadId) {
      setError("Lead ID is missing. Cannot update project.")
      setLoading(false)
      return
    }

    try {
      // Construct the data object to match the Spring Boot Project model
      const processedDataForBackend = {
        ...projectData, // Spreads all current projectData state fields
        // Ensure project_manager and site_engineer are sent as objects with 'id'
        project_manager: projectData.projectManager ? { id: projectData.projectManager } : null,
        site_engineer: projectData.siteEngineer ? { id: projectData.siteEngineer } : null,
        // employee_updatedby is already part of projectData state, but ensure it's an object
        employee_updatedby: { id: user?.userId }, // Always send current user ID for updated_by
      }

      // Call the service directly from here
      await projectService.createOrUpdateProject(processedDataForBackend, "project", leadId)
      onClose()
    } catch (err) {
      console.log(err)
      setError(err.message || "Failed to update project")
      window.scrollTo(0, 0)
    } finally {
      setLoading(false)
    }
  }

  const Capitalize = (str) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const matchingLabels = (id, producttypelist) => {
    let newlabel = ""
    if (id !== null && id !== "") {
      const matchingItem = producttypelist.find((item) => item.id === id.id)
      if (matchingItem) {
        newlabel = matchingItem.label.replace(/,/g, "")
      }
    }
    return newlabel
  }

  const TableHeader = ({ children }) => (
    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b flex-wrap">
      {children}
    </th>
  )

  // Expandable Section Component
  const ExpandableSection = ({ title, isExpanded, onToggle, children, bgColor, borderColor, headerTextColor }) => (
    <div className={`rounded-lg border-2 ${borderColor} overflow-hidden shadow-sm`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-6 py-4 ${bgColor} ${headerTextColor} font-semibold text-lg flex justify-between items-center hover:opacity-90 transition-opacity`}
      >
        <span>{title}</span>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // Show loading spinner while data is being fetched
  if (dataLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading lead details...</p>
        </div>
      </motion.div>
    )
  }

  // Show error message if lead data failed to load
  if (error && !lead) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center justify-center">
          <p className="text-lg font-medium text-red-700">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    )
  }

  // If lead is null after loading, it means no data was found for the given leadId
  if (!lead) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center justify-center">
          <p className="text-lg font-medium text-gray-700">No lead details found for ID: {leadId}.</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold">Project Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
          {/* Lead Details Section */}
          <ExpandableSection
            title="Lead Details"
            isExpanded={expandedSections.leadDetails}
            onToggle={() => toggleSection("leadDetails")}
            bgColor="bg-purple-100"
            borderColor="border-purple-300"
            headerTextColor="text-purple-800"
          >
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4 rounded-lg p-4 bg-gray-50 border border-purple-200">
                <h3 className="font-semibold text-lg border-b border-purple-300 pb-2">Basic Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lead ID : {lead.lead_code}</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lead Priority : {Capitalize(lead.lead_priority)}
                  </label>
                </div>
                {lead.employee && lead.employee.lastName !== null ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created By : {" " + lead.employee.firstName + " " + lead.employee.lastName}
                    </label>
                  </div>
                ) : null}
              </div>
              {/* Additional Details */}
              {lead.client_name && lead.project_location && lead.office_location && (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name : {lead.client_name}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Location : {lead.project_location}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Office Location : {lead.office_location}
                      </label>
                    </div>
                  </div>
                  {lead.additionalDetails && lead.additionalDetails.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Phone</TableHeader>
                            <TableHeader>Email</TableHeader>
                            <TableHeader>Designation</TableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lead.additionalDetails.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-2 py-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {row.contact_person_name}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {row.contact_person_phonenumber}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {row.contact_person_email}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {row.contact_person_designation}
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* Addition Details Section End */}
              {/* Middle Man Details */}
              {lead.middle_man_client_name && lead.middle_man_project_location && lead.middle_man_office_location && (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Middle Man Details</h3>
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name : {lead.middle_man_client_name}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Location : {lead.middle_man_project_location}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Office Location : {lead.middle_man_office_location}
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    {lead.middleManDetails && lead.middleManDetails.length > 0 && (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Phone no</TableHeader>
                            <TableHeader>Email</TableHeader>
                            <TableHeader>Designation</TableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lead.middleManDetails.map((mrow, midx) => (
                            <tr key={midx} className="hover:bg-gray-50">
                              <td className="px-2 py-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mcontact_person_name}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mcontact_person_phonenumber}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mcontact_person_email}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mcontact_person_designation}
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
              {/* Middle Man End */}
              {/* Architect Firm Details Section */}
              {lead.architect_client_name && lead.architect_project_location && lead.architect_office_location && (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Architect Firm Details</h3>
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name : {lead.architect_client_name}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Location : {lead.architect_project_location}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Office Location : {lead.architect_office_location}
                      </label>
                    </div>
                  </div>
                  {lead.architectFirmDetails && lead.architectFirmDetails.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Phone no</TableHeader>
                            <TableHeader>Email</TableHeader>
                            <TableHeader>Designation</TableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lead.architectFirmDetails.map((mrow, midx) => (
                            <tr key={midx} className="hover:bg-gray-50">
                              <td className="px-2 py-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.arcontact_person_name}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.arcontact_person_phonenumber}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.arcontact_person_email}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.arcontact_person_designation}
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* Architect Firm Details Section End */}
              {/* MEP Firm Details Section */}
              {lead.mep_client_name && lead.mep_project_location && lead.mep_office_location && (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">MEP Firm Details</h3>
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name : {lead.mep_client_name}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Location : {lead.mep_project_location}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Office Location : {lead.mep_office_location}
                      </label>
                    </div>
                  </div>
                  {lead.mepFirmDetails && lead.mepFirmDetails.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Phone no</TableHeader>
                            <TableHeader>Email</TableHeader>
                            <TableHeader>Designation</TableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lead.mepFirmDetails.map((mrow, midx) => (
                            <tr key={midx} className="hover:bg-gray-50">
                              <td className="px-2 py-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mepcontact_person_name}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mepcontact_person_phonenumber}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mepcontact_person_email}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.mepcontact_person_designation}
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* MEP Firm Details Section End */}
              {/* PMC Firm Details Section */}
              {lead.pmc_client_name && lead.pmc_project_location && lead.pmc_office_location && (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">PMC Firm Details</h3>
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name : {lead.pmc_client_name}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Project Location : {lead.pmc_project_location}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Office Location : {lead.pmc_office_location}
                      </label>
                    </div>
                  </div>
                  {lead.pmcFirmDetails && lead.pmcFirmDetails.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Phone no</TableHeader>
                            <TableHeader>Email</TableHeader>
                            <TableHeader>Designation</TableHeader>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lead.pmcFirmDetails.map((mrow, midx) => (
                            <tr key={midx} className="hover:bg-gray-50">
                              <td className="px-2 py-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.pmccontact_person_name}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.pmccontact_person_phonenumber}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.pmccontact_person_email}
                                </label>
                              </td>
                              <td>
                                <label className="block text-sm font-medium text-gray-700">
                                  {mrow.pmccontact_person_designation}
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {/* PMC Firm Details End */}
            </div>
          </ExpandableSection>
          {/* Project Details Section */}
          <ExpandableSection
            title="Project Details"
            isExpanded={expandedSections.projectDetails}
            onToggle={() => toggleSection("projectDetails")}
            bgColor="bg-amber-100"
            borderColor="border-amber-300"
            headerTextColor="text-amber-800"
          >
            <div className="space-y-6">
              {/* Project Information */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Assign Project Manager <span className="text-red-500">*</span>
                </label>
                <select
                  name="project_manager"
                  value={projectData.projectManager} // Bind to projectData.projectManager
                  onChange={(e) => setProjectData({ ...projectData, projectManager: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Project Manager</option>
                  {managerslist.map((manager, i) => {
                    return (
                      <option key={i} value={manager.id}>
                        {manager.firstName + " " + manager.lastName}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Assign Site Engineer <span className="text-red-500">*</span>
                </label>
                <select
                  name="site_engineer"
                  value={projectData.siteEngineer} // Bind to projectData.siteEngineer
                  onChange={(e) => setProjectData({ ...projectData, siteEngineer: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Engineer</option>
                  {seData.map((engineer, i) => {
                    return (
                      <option key={i} value={engineer.id}>
                        {engineer.firstName + " " + engineer.lastName}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </ExpandableSection>
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            {(activeTab === "unassigned-leads" ||
              activeTab === "sse-new-leads" ||
              activeTab === "assign-leads-to-bdm" ||
              (activeTab === "assigned-leads" && lead && lead.need_of_field_visit !== null) ||
              activeTab === "sse-inprogress-leads" ||
              activeTab === "salestl-won-leads" ||
              activeTab === "bdm-assigned-field-visit") && (
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  "Update Project"
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default ProjectLeadDetails
