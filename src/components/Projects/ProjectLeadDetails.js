"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiX } from "react-icons/fi"
import { leadService } from "../../services/leadService"
import { projectService } from "../../services/projectService"
import { useAuth } from "../../contexts/AuthContext"

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

function ProjectLeadDetails({ leadId, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()
  const handoverFileInputRef = useRef(null)
  const nocFileInputRef = useRef(null)

  const [expandedSections, setExpandedSections] = useState({
    leadDetails: false,
    projectDetails: true,
  })

  const userId = user ? user.userId : ""
  const [lead, setLead] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [managerslist, setManagerslist] = useState([])
  const [seData, setSEList] = useState([])
  const [sourcelist, setSourcelist] = useState([])
  const [typelist, setTypelist] = useState([])
  const [producttypelist, setProductTypelist] = useState([])

  const [projectId, setProjectId] = useState(null)
  const [handoverFileUploading, setHandoverFileUploading] = useState(false)
  const [nocFileUploading, setNocFileUploading] = useState(false)

  const [projectData, setProjectData] = useState({
    projectName: "",
    projectStatus: "planning",
    projectManager: "",
    siteEngineer: "",
    handover_file_status: "",
    form_a_noc_status: "",
    approval_from_fm: "",
    payment_approval_date_by_fm: "",
    project_completion_eta: "",
    project_completion_date: "",
    handoverFilePath: "",
    handoverFileName: "",
    nocFilePath: "",
    nocFileName: "",
    employee_updatedby: { id: userId },
  })

  useEffect(() => {
    const fetchAllInitialData = async () => {
      setDataLoading(true)
      setError("")
      try {
        console.log("[v0] Fetching data for leadId:", leadId) // Added debug log
        const [
          leadDetails,
          projectdetailsResponse,
          leadSource,
          leadType,
          leadProductType,
          managers,
          siteEngineers,
        ] = await Promise.all([
          projectService.getLeadByLeadId(leadId),
          projectService.getProjectByLeadId(leadId),
          leadService.getLeadSourceList(),
          leadService.getLeadTypeList(),
          leadService.getLeadProductTypeList(),
          projectService.getProjectManagerList(),
          projectService.getSiteEngineerList(),
        ])

        console.log("[v0] Project details response:", projectdetailsResponse) // Added debug log
        console.log("[v0] Project ID from response:", projectdetailsResponse?.id) // Added debug log

        setLead(leadDetails)
        setSourcelist(leadSource)
        setTypelist(leadType)
        setProductTypelist(leadProductType)
        setManagerslist(managers)
        setSEList(siteEngineers)

        if (projectdetailsResponse && projectdetailsResponse.id) {
          console.log("[v0] Setting projectId to:", projectdetailsResponse.id) // Added debug log
          setProjectId(projectdetailsResponse.id)
        } else if (projectdetailsResponse && projectdetailsResponse.projectId) {
          console.log("[v0] Setting projectId from projectId field:", projectdetailsResponse.projectId) // Added debug log
          setProjectId(projectdetailsResponse.projectId)
        } else {
          console.log("[v0] No project ID found in response") // Added debug log
        }

        let initialProjectManager = projectdetailsResponse.projectManager?.id
          ? Number.parseInt(projectdetailsResponse.projectManager.id, 10)
          : ""
        const initialSiteEngineer = projectdetailsResponse.siteEngineer?.id
          ? Number.parseInt(projectdetailsResponse.siteEngineer.id, 10)
          : ""
        let initialProjectName = ""
        let initialProjectStatus = "planning"
        let initialHandoverFileStatus = ""
        let initialFormANOCStatus = ""
        let initialApprovalFromFM = ""
        let initialPaymentApprovalDateByFM = ""
        let initialProjectCompletionETA = ""
        let initialProjectCompletionDate = ""
        let initialHandoverFilePath = ""
        let initialHandoverFileName = ""
        let initialNocFilePath = ""
        let initialNocFileName = ""

        if (projectdetailsResponse) {
          initialProjectName = projectdetailsResponse.projectName || ""
          initialProjectStatus = projectdetailsResponse.projectStatus || "planning"
          initialHandoverFileStatus = projectdetailsResponse.handover_file_status || ""
          initialFormANOCStatus = projectdetailsResponse.form_a_noc_status || ""
          initialApprovalFromFM = projectdetailsResponse.handoverFromFinance || ""
          initialPaymentApprovalDateByFM = projectdetailsResponse.payment_approval_date_by_fm || ""
          initialProjectCompletionETA = projectdetailsResponse.project_completion_eta || ""
          initialProjectCompletionDate = projectdetailsResponse.project_completion_date || ""
          initialHandoverFilePath = projectdetailsResponse.handoverFilePath || ""
          initialHandoverFileName = projectdetailsResponse.handoverFileName || ""
          initialNocFilePath = projectdetailsResponse.nocFilePath || ""
          initialNocFileName = projectdetailsResponse.nocFileName || ""
        }

        if (!initialProjectManager && managers.some((manager) => manager.id === userId)) {
          initialProjectManager = userId
        }

        setProjectData({
          projectName: initialProjectName,
          projectStatus: initialProjectStatus,
          projectManager: initialProjectManager,
          siteEngineer: initialSiteEngineer,
          handover_file_status: initialHandoverFileStatus,
          form_a_noc_status: initialFormANOCStatus,
          approval_from_fm: initialApprovalFromFM,
          payment_approval_date_by_fm: initialPaymentApprovalDateByFM,
          project_completion_eta: initialProjectCompletionETA,
          project_completion_date: initialProjectCompletionDate,
          handoverFilePath: initialHandoverFilePath,
          handoverFileName: initialHandoverFileName,
          nocFilePath: initialNocFilePath,
          nocFileName: initialNocFileName,
          employee_updatedby: { id: userId },
        })
      } catch (err) {
        setError("Failed to load project details or related lists.")
        console.error(err)
        setLead(null)
        setProjectData({
          projectName: "",
          projectStatus: "planning",
          projectManager: "",
          siteEngineer: "",
          handover_file_status: "",
          form_a_noc_status: "",
          approval_from_fm: "",
          payment_approval_date_by_fm: "",
          project_completion_eta: "",
          project_completion_date: "",
          handoverFilePath: "",
          handoverFileName: "",
          nocFilePath: "",
          nocFileName: "",
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
      setProjectData({
        projectName: "",
        projectStatus: "planning",
        projectManager: "",
        siteEngineer: "",
        handover_file_status: "",
        form_a_noc_status: "",
        approval_from_fm: "",
        payment_approval_date_by_fm: "",
        project_completion_eta: "",
        project_completion_date: "",
        handoverFilePath: "",
        handoverFileName: "",
        nocFilePath: "",
        nocFileName: "",
        employee_updatedby: { id: userId },
      })
    }
  }, [leadId, userId])


  const handleHandoverFileUpload = async (e) => {
    console.log("[v0] Handover file upload triggered")
    const file = e.target.files[0]
    console.log("[v0] File selected:", file?.name)
    
    if (!file) {
      console.log("[v0] No file selected, returning")
      return
    }

    console.log("[v0] Current projectId:", projectId)
    if (!projectId) {
      const errorMsg = "Please save the project first before uploading files"
      console.log("[v0] Error:", errorMsg)
      setError(errorMsg)
      return
    }

    setHandoverFileUploading(true)
    setError("")
    console.log("[v0] Starting handover file upload for projectId:", projectId)

    try {
      console.log("[v0] Calling projectService.uploadHandoverFile...")
      const response = await projectService.uploadHandoverFile(projectId, file)
      console.log("[v0] Upload response:", response)
      
      setProjectData(prev => ({
        ...prev,
        handoverFilePath: response.handoverFilePath || response.fileUrl,
        handoverFileName: response.handoverFileName || file.name,
        project_completion_date: response.project_completion_date || prev.project_completion_date,
        projectStatus: response.projectStatus || prev.projectStatus
      }))
      alert("Handover file uploaded successfully!")
      console.log("[v0] State updated, fetching updated project...")
      
      const updatedProject = await projectService.getProjectByLeadId(leadId)
      console.log("[v0] Updated project data:", updatedProject)
      
      if (updatedProject) {
        setProjectData(prev => ({
          ...prev,
          handoverFilePath: updatedProject.handoverFilePath || prev.handoverFilePath,
          handoverFileName: updatedProject.handoverFileName || prev.handoverFileName,
          nocFilePath: updatedProject.nocFilePath || prev.nocFilePath,
          nocFileName: updatedProject.nocFileName || prev.nocFileName,
          project_completion_date: updatedProject.project_completion_date || prev.project_completion_date,
          projectStatus: updatedProject.projectStatus || prev.projectStatus
        }))
      }
    } catch (err) {
      console.error("[v0] Upload error:", err)
      console.error("[v0] Error response:", err.response)
      const errorMsg = err.response?.data?.message || err.message || "Failed to upload handover file"
      setError(errorMsg)
    } finally {
      setHandoverFileUploading(false)
      console.log("[v0] Handover file upload completed")
    }
  }

  const handleNocFileUpload = async (e) => {
    console.log("[v0] NOC file upload triggered")
    const file = e.target.files[0]
    console.log("[v0] File selected:", file?.name)
    
    if (!file) {
      console.log("[v0] No file selected, returning")
      return
    }

    console.log("[v0] Current projectId:", projectId)
    if (!projectId) {
      const errorMsg = "Please save the project first before uploading files"
      console.log("[v0] Error:", errorMsg)
      setError(errorMsg)
      return
    }

    setNocFileUploading(true)
    setError("")
    console.log("[v0] Starting NOC file upload for projectId:", projectId)

    try {
      console.log("[v0] Calling projectService.uploadNocFile...")
      const response = await projectService.uploadNocFile(projectId, file)
      console.log("[v0] Upload response:", response)
      
      setProjectData(prev => ({
        ...prev,
        nocFilePath: response.nocFilePath || response.fileUrl,
        nocFileName: response.nocFileName || file.name,
        project_completion_date: response.project_completion_date || prev.project_completion_date,
        projectStatus: response.projectStatus || prev.projectStatus
      }))
      alert("NOC file uploaded successfully!")
      console.log("[v0] State updated, fetching updated project...")
      
      const updatedProject = await projectService.getProjectByLeadId(leadId)
      console.log("[v0] Updated project data:", updatedProject)
      
      if (updatedProject) {
        setProjectData(prev => ({
          ...prev,
          handoverFilePath: updatedProject.handoverFilePath || prev.handoverFilePath,
          handoverFileName: updatedProject.handoverFileName || prev.handoverFileName,
          nocFilePath: updatedProject.nocFilePath || prev.nocFilePath,
          nocFileName: updatedProject.nocFileName || prev.nocFileName,
          project_completion_date: updatedProject.project_completion_date || prev.project_completion_date,
          projectStatus: updatedProject.projectStatus || prev.projectStatus
        }))
      }
    } catch (err) {
      console.error("[v0] Upload error:", err)
      console.error("[v0] Error response:", err.response)
      const errorMsg = err.response?.data?.message || err.message || "Failed to upload NOC file"
      setError(errorMsg)
    } finally {
      setNocFileUploading(false)
      console.log("[v0] NOC file upload completed")
    }
  }

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

    if (!leadId) {
      setError("Lead ID is missing. Cannot update project.")
      setLoading(false)
      return
    }

    const payload = {
      projectName: projectData.projectName,
      projectStatus: projectData.projectStatus,
      handover_file_status: projectData.handover_file_status,
      form_a_noc_status: projectData.form_a_noc_status,
      approval_from_fm: projectData.approval_from_fm,
      payment_approval_date_by_fm: projectData.payment_approval_date_by_fm,
      project_completion_eta: projectData.project_completion_eta,
      project_completion_date: projectData.project_completion_date,
      handoverFilePath: projectData.handoverFilePath,
      handoverFileName: projectData.handoverFileName,
      nocFilePath: projectData.nocFilePath,
      nocFileName: projectData.nocFileName,
      employee_updatedby: { id: user?.userId },
    }

    if (projectData.projectManager) {
      payload.project_manager = { id: Number.parseInt(projectData.projectManager, 10) }
    } else {
      payload.project_manager = null
    }

    if (projectData.siteEngineer) {
      payload.site_engineer = { id: Number.parseInt(projectData.siteEngineer, 10) }
    } else {
      payload.site_engineer = null
    }

    try {
      await projectService.createOrUpdateProject(payload, "project", leadId)
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
            {/* ... existing lead details code ... */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Assign Project Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="project_manager"
                    value={projectData.projectManager}
                    onChange={(e) =>
                      setProjectData({ ...projectData, projectManager: Number.parseInt(e.target.value, 10) })
                    }
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
                    value={projectData.siteEngineer}
                    onChange={(e) =>
                      setProjectData({ ...projectData, siteEngineer: Number.parseInt(e.target.value, 10) })
                    }
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
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    value={projectData.projectName}
                    onChange={(e) => setProjectData({ ...projectData, projectName: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="handover_file_status" className="block text-sm font-medium text-gray-700">
                    Handover File Status
                  </label>
                  <select
                    id="handover_file_status"
                    name="handover_file_status"
                    value={projectData.handover_file_status}
                    onChange={(e) => setProjectData({ ...projectData, handover_file_status: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>

                {projectData.handover_file_status === "Completed" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Handover File
                    </label>
                    
                    {projectData.handoverFileName && projectData.handoverFilePath && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">
                              Current File: {projectData.handoverFileName}
                            </span>
                          </div>
                          <a
                            href={projectData.handoverFilePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            View/Download
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={handoverFileInputRef}
                        onChange={handleHandoverFileUpload}
                        accept=".pdf,.doc,.docx"
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                        disabled={handoverFileUploading}
                      />
                      {handoverFileUploading && (
                        <div className="flex items-center text-blue-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Uploading...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="form_a_noc_status" className="block text-sm font-medium text-gray-700">
                    Form A NOC Status
                  </label>
                  <select
                    id="form_a_noc_status"
                    name="form_a_noc_status"
                    value={projectData.form_a_noc_status}
                    onChange={(e) => setProjectData({ ...projectData, form_a_noc_status: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>

                {projectData.form_a_noc_status === "Received" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload NOC Form File
                    </label>
                    
                    {projectData.nocFileName && projectData.nocFilePath && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">
                              Current File: {projectData.nocFileName}
                            </span>
                          </div>
                          <a
                            href={projectData.nocFilePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            View/Download
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={nocFileInputRef}
                        onChange={handleNocFileUpload}
                        accept=".pdf,.doc,.docx"
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-green-50 file:text-green-700
                          hover:file:bg-green-100"
                        disabled={nocFileUploading}
                      />
                      {nocFileUploading && (
                        <div className="flex items-center text-green-600">
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Uploading...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="approval_from_fm" className="block text-sm font-medium text-gray-700">
                    Approval from FM
                  </label>
                  <input
                    type="text"
                    id="approval_from_fm"
                    value={projectData.approval_from_fm || "PENDING"}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label htmlFor="project_completion_eta" className="block text-sm font-medium text-gray-700">
                    Project Completion ETA
                  </label>
                  <input
                    type="date"
                    id="project_completion_eta"
                    name="project_completion_eta"
                    value={projectData.project_completion_eta}
                    onChange={(e) => setProjectData({ ...projectData, project_completion_eta: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="project_completion_date" className="block text-sm font-medium text-gray-700">
                    Project Completion Date
                  </label>
                  <input
                    type="date"
                    id="project_completion_date"
                    name="project_completion_date"
                    value={projectData.project_completion_date}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-set when both files are uploaded</p>
                </div>
              </div>
            </div>
          </ExpandableSection>

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