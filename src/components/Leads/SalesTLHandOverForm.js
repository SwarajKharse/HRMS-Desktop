import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { FiX, FiUpload, FiFile, FiExternalLink, FiAlertCircle, FiCheck } from "react-icons/fi"
import { authService } from "../../services/authService" // Assuming path is correct
import { leadService } from "../../services/leadService" // Assuming path is correct
import { useAuth } from "../../contexts/AuthContext" // Assuming path is correct
import { projectService } from "../../services/projectService" // This will be our mock service
import ProductBOQSelector from "../Projects/ProductBOQSelector" // Assuming path is correct

function SalesTLHandOverForm({ lead, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const modalRef = useRef(null) // Ref for the main modal container

  let userId = ""
  if (user) {
    userId = user.userId
  }

  const allIds = lead.lead_proposal_type !== null ? lead.lead_proposal_type.map((item) => item.id) : []

  const [formData, setFormData] = useState({
    ...lead,
    amc_or_project: lead.amc_or_project,
    proposal_type: allIds || [],
    lead_proposal_type: lead.lead_proposal_type,
    employee_updatedby: {
      id: userId,
    },
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [managerslist, setManagerslist] = useState([])
  const [ssedata, setSSEList] = useState([])
  const [bdmdata, setBDMList] = useState([])
  const [sourcelist, setSourcelist] = useState([])
  const [typelist, setTypelist] = useState([])
  const [producttypelist, setProductTypelist] = useState([])
  const [localNeedOfFieldVisit, setLocalFieldVisit] = useState(lead.need_of_field_visit || false)
  const [checkInSelfieUploaded, setCheckInSelfieUploaded] = useState(lead.check_in_selfie_url ? true : false)
  const [checkInSelfieLocationURL, setCheckInSelfieLocation] = useState("")
  const [checkOutSelfieLocation, setCheckOutSelfieLocation] = useState("")
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [poUpload, setPoUploads] = useState(false)
  const [poUploadedDocuments, setPoUploadedDocuments] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [existingProject, setExistingProject] = useState(null)
  const [isEditingProjectTitle, setIsEditingProjectTitle] = useState(false)
  const [editedProjectTitle, setEditedProjectTitle] = useState("")

  const [project, setProject] = useState({
    project_name: "",
    custom_project_name: "",
  })
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [boqData, setBOQData] = useState(null)
  const [showBOQSelector, setShowBOQSelector] = useState(false)
  const [existingBOQData, setExistingBOQData] = useState(null)

  // --- DEBUG LOG ---
  console.log("SalesTLHandOverForm Render - lead.salestl_approval_status:", lead.salestl_approval_status)
  // --- END DEBUG LOG ---

  // Effect for main modal click outside
  useEffect(() => {
    function handleClickOutsideModal(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose() // Close the main modal
      }
    }
    document.addEventListener("mousedown", handleClickOutsideModal)
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideModal)
    }
  }, [onClose]) // Depend on onClose to avoid stale closures

  useEffect(() => {
    checkExistingProject()
  }, [lead.id])

  const fetchUploadedDocuments = async () => {
    if (lead && lead.id) {
      try {
        setIsLoadingDocuments(true)
        const response = await leadService.getLeadDocuments(lead.id, "proposal")
        setUploadedDocuments(response || [])
      } catch (error) {
        console.error("Error fetching documents:", error)
      } finally {
        setIsLoadingDocuments(false)
      }
    }
  }

  const fetchUploadedPOs = async () => {
    if (lead && lead.id) {
      try {
        setIsLoadingDocuments(true)
        const response = await leadService.getLeadDocuments(lead.id, "po_document")
        setPoUploadedDocuments(response || [])
      } catch (error) {
        console.error("Error fetching documents:", error)
      } finally {
        setIsLoadingDocuments(false)
      }
    }
  }

  useEffect(() => {
    if ((activeTab === "sse-inprogress-leads" || activeTab === "assigned-leads") && lead && lead.id) {
      fetchUploadedDocuments()
    }
    if (activeTab === "salestl-won-leads" && lead && lead.id) {
      fetchUploadedPOs()
    }
  }, [activeTab, lead])

  const Toggle = ({ checked, onChange, size = "small" }) => {
    const baseClasses =
      "relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    const sizeClasses = size === "small" ? "h-4 w-8" : "h-6 w-11"
    return (
      <button
        type="button"
        className={`${baseClasses} ${sizeClasses} ${checked ? "bg-blue-600" : "bg-gray-200"}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`${
            checked ? "translate-x-4" : "translate-x-0.5"
          } inline-block transform rounded-full bg-white transition-transform ${
            size === "small" ? "h-3 w-3" : "h-5 w-5"
          }`}
        />
      </button>
    )
  }

  const [showProposalTypeDropdown, setShowProposalTypeDropdown] = useState(false)

  useEffect(() => {
    function handleClickOutside(event) {
      const dropdown = document.getElementById("product-type-dropdown")
      if (showProposalTypeDropdown && dropdown && !dropdown.contains(event.target)) {
        setShowProposalTypeDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setShowProposalTypeDropdown])

  useEffect(() => {
    fetchDepartmentsAndDesignations()
  }, [authService.getUser().orgId])

  const fetchDepartmentsAndDesignations = async () => {
    try {
      if (activeTab == "unassigned-leads") {
        const [ssedata, leadSource, leadType, leadProductType] = await Promise.all([
          leadService.getSSEList(),
          leadService.getLeadSourceList(),
          leadService.getLeadTypeList(),
          leadService.getLeadProductTypeList(),
        ])
        console.log("ssedata")
        console.log(ssedata)
        setSourcelist(leadSource)
        setTypelist(leadType)
        setProductTypelist(leadProductType)
        setSSEList(ssedata)
      }
      if (activeTab === "salestl-won-leads") {
        const [leadSource, leadType, leadProductType] = await Promise.all([
          leadService.getLeadSourceList(),
          leadService.getLeadTypeList(),
          leadService.getLeadProductTypeList(),
        ])
        setSourcelist(leadSource)
        setTypelist(leadType)
        setProductTypelist(leadProductType)
      }
    } catch (err) {
      setError("Failed to load departments and designations")
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }

  const checkExistingProject = async () => {
    try {
      const projectData = await projectService.getProjectByLeadId(lead.id)
      if (projectData) {
        setExistingProject(projectData)
        setProject((prev) => ({
          ...prev,
          project_name: projectData.projectName,
        }))
        setEditedProjectTitle(projectData.projectName)
        if (projectData.hasExistingBOQ && projectData.boq) {
          const existingBOQ = {
            project_id: projectData.projectId,
            items: projectData.boq.items.map((item) => ({
              id: item.id,
              productId: item.product.id,
              product: item.product,
              qty: item.totalQty || item.qty,
              totalQty: item.totalQty || item.qty,
              make: item.make,
              uom: item.uom,
              supplyRate: item.supplyRate,
              installationRate: item.installationRate,
              supplyAmount: item.supplyAmount,
              installationAmount: item.installationAmount,
              total: item.total,
              leadProductTypeId: item.leadProductType
                ? item.leadProductType.id
                : item.product.categoryId
                ? item.product.categoryId.id
                : null,
              pmApprovalStatus: item.pmApprovalStatus,
              salestlApprovalStatus: item.salestlApprovalStatus,
              pmApprovalRemarks: item.pmApprovalRemarks,
              salestlApprovalRemarks: item.salestlApprovalRemarks,
              pmApprovalDate: item.pmApprovalDate,
              salestlApprovalDate: item.salestlApprovalDate,
            })),
          }
          setExistingBOQData(existingBOQ)
          setBOQData(existingBOQ)
          console.log("Loaded existing BOQ data (frontend mapped):", existingBOQ)
        }
      }
    } catch (error) {
      console.error("Error checking existing project:", error)
    }
  }

  const handleProjectTitleEdit = async () => {
    if (!existingProject || !editedProjectTitle.trim()) {
      setError("Please enter a valid project title")
      return
    }
    try {
      setLoading(true)
      await projectService.updateProjectTitle(existingProject.projectId, editedProjectTitle)
      setExistingProject((prev) => ({
        ...prev,
        projectName: editedProjectTitle,
      }))
      setProject((prev) => ({
        ...prev,
        project_name: editedProjectTitle,
      }))
      setIsEditingProjectTitle(false)
      setSuccessMessage("Project title updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || "Failed to update project title")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(name + " *********** " + value)
    console.log(e.target.value)
    setFormData({
      ...formData,
      [name]: value,
    })
    if (error) {
      console.log(error)
    }
  }

  const handleBOQSave = (boqDataFromSelector, wasSavedToBackend = false) => {
    console.log("BOQ Data received from selector:", boqDataFromSelector)
    setBOQData(boqDataFromSelector)
    setShowBOQSelector(false)
    if (wasSavedToBackend) {
      setSuccessMessage("BOQ saved successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      checkExistingProject() // Re-fetch project data to ensure latest BOQ and project details are loaded
    }
    console.log("BOQ Data saved:", boqDataFromSelector)
  }

  const handleBOQStatusChange = async (status, remarks) => {
    try {
      setLoading(true)
      setError("")
      if (!existingProject || !existingProject.projectId) {
        throw new Error("Project not found for BOQ status update.")
      }
      setSuccessMessage(`BOQ status updated to ${status === "1" ? "Approved" : "Rejected"} successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
      await onSubmit()
      onClose()
    } catch (err) {
      console.error("Error updating BOQ status:", err)
      setError(`Failed to update BOQ status: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    console.log("Submit Clicked " + activeTab)
    e.preventDefault()
    setLoading(true)
    setError("")

    const finalProjectName = existingProject
      ? existingProject.projectName
      : project.project_name === "other"
      ? project.custom_project_name
      : project.project_name

    try {
      if (formData.amc_or_project === "project") {
        if (!finalProjectName || finalProjectName.trim() === "") {
          throw new Error("Please select or enter a project name")
        }
        if (!boqData || !boqData.items || boqData.items.length === 0) {
          throw new Error("Please create a BOQ with at least one item for the project")
        }
      }

      // Construct the payload for the backend, preserving existing project data
      const payloadForBackend = {
        // Start with existing project data if available, mapping DTO names to model names
        ...(existingProject ? {
            id: existingProject.projectId, // Crucial for updating an existing entity
            project_name: existingProject.projectName,
            project_status: existingProject.projectStatus,
            handover_from_sales: existingProject.handoverFromSales,
            date_of_handover_from_sales: existingProject.dateOfHandoverFromSales,
            date_of_into_call_by_se: existingProject.dateOfIntoCallBySe,
            date_of_kick_of_meeting: existingProject.dateOfKickOfMeeting,
            project_initiation_meet_date: existingProject.projectInitiationMeetDate,
            projectInitiationDate: existingProject.projectInitiationDate, // Direct match
            numberOfWeeks: existingProject.numberOfWeeks, // Direct match
            execution_team: existingProject.executionTeam,
            handover_file_status: existingProject.handover_file_status,
            form_a_noc_status: existingProject.form_a_noc_status,
            approval_from_fm: existingProject.approval_from_fm,
            payment_approval_date_by_fm: existingProject.payment_approval_date_by_fm,
            project_completion_eta: existingProject.project_completion_eta,
            project_completion_date: existingProject.project_completion_date,
            approval_from_pm: existingProject.approvalFromPm,
            // Nested employee objects
            sales_tl: existingProject.salesTl ? { id: existingProject.salesTl.id } : null,
            project_manager: existingProject.projectManager ? { id: existingProject.projectManager.id } : null,
            site_engineer: existingProject.siteEngineer ? { id: existingProject.siteEngineer.id } : null,
            // createdAt and updatedAt are handled by backend annotations
        } : {}), // If no existing project, start with an empty object

        // Override with values from the form's current state
        amc_or_project: formData.amc_or_project,
        project_name: finalProjectName, // This will override existingProject.projectName if it was set
        employee_updatedby: {
            id: userId,
        },
      }

      console.log("Payload to backend:", payloadForBackend)

      const projectResponse = await projectService.createOrUpdateProject(
        payloadForBackend, // Use the comprehensive payload
        formData.amc_or_project,
        lead.id,
      )
      console.log("Project creation response:", projectResponse)

      if (formData.amc_or_project === "project" && boqData && projectResponse && projectResponse.projectId) {
        try {
          console.log("Saving BOQ for project ID:", projectResponse.projectId)
          console.log("BOQ data being saved:", boqData)
          await projectService.createOrUpdateBOQ(projectResponse.projectId, boqData)
          console.log("BOQ saved successfully")
          setSuccessMessage("Project and BOQ saved successfully")
        } catch (boqError) {
          console.error("BOQ creation failed:", boqError)
          setError("Project saved successfully, but BOQ creation failed: " + (boqError.message || boqError))
          setLoading(false)
          return
        }
      } else if (formData.amc_or_project === "amc") {
        setSuccessMessage("AMC handover successful")
      } else {
        setSuccessMessage("Lead handover successful")
      }

      setTimeout(() => setSuccessMessage(null), 3000)
      await onSubmit()
      onClose()
    } catch (err) {
      console.error("Handover error:", err)
      setError(err.message || "Failed to complete handover")
      window.scrollTo(0, 0)
    } finally {
      setLoading(false)
    }
  }

  const Capitalize = (str) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const TableHeader = ({ children }) => (
    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b flex-wrap">
      {children}
    </th>
  )

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

  const handleTypeChange = (field, value) => {
    if (field === "project_name") {
      if (value === "other") {
        setShowCustomInput(true)
        setProject((prev) => ({
          ...prev,
          project_name: value,
          custom_project_name: "",
        }))
      } else {
        setShowCustomInput(false)
        setProject((prev) => ({
          ...prev,
          project_name: value,
          custom_project_name: "",
        }))
      }
    } else if (field === "amc_or_project") {
      setFormData({
        ...formData,
        amc_or_project: value,
      })
      if (value !== "project") {
        setBOQData(null)
        setShowBOQSelector(false)
      }
      console.log("Value is   " + value)
      console.log(formData)
    } else {
      setProject((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const FileInput = ({ label, name, onChange, accept = "image/*", required = false, reference = null }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center">
          <FiUpload className="mr-2" />
          <span>Choose File</span>
          <input
            type="file"
            name={name}
            onChange={onChange}
            accept={accept}
            className="hidden"
            required={required}
            ref={reference}
          />
        </label>
        <span className="text-sm text-gray-500">{name === "lead_po" && poUpload ? poUpload : "No file chosen"}</span>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      ref={modalRef} // Attach ref to the main modal container
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
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
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">HandOver Lead</h2>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <FiX size={20} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-4 rounded-lg p-4 bg-white border">
            <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead ID : {lead.lead_code}</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lead Priority : {Capitalize(lead.lead_priority)}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lead Type :
                  {typelist.map((country, i) => {
                    return country.id == lead.lead_type ? " " + country.label : ""
                  })}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Type:{" "}
                  {lead.lead_product_type !== null
                    ? lead.lead_product_type.map((country, itr) => {
                        const ptlabel = matchingLabels(country, producttypelist).toString()
                        return itr !== lead.lead_product_type.length - 1
                          ? ptlabel + " , "
                          : ptlabel.substring(0, ptlabel.length - 1)
                      })
                    : ""}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lead Source :
                  {sourcelist.map((country, i) => {
                    return country.id == lead.lead_source ? " " + country.label : ""
                  })}
                </label>
              </div>
              {lead.employee !== null && lead.employee.firstName !== null ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Created By :{" " + lead.employee.firstName + " " + lead.employee.lastName}
                  </label>
                </div>
              ) : null}
            </div>
          </div>
          {/* Basic Information Section End */}
          {/* Additional Details */}
          {lead.client_name && lead.project_location && lead.office_location && (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>
              <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Name : {lead.client_name}</label>
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
                            <label className="block text-sm font-medium text-gray-700">{row.contact_person_name}</label>
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
              {lead.middleManDetails && lead.middleManDetails.length > 0 && (
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
                </div>
              )}
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
          {lead.need_of_field_visit !== null ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Proposal Approval</h3>
              {/* Shared Status */}
              <>
                {lead.salestl_approval_status == "1" ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Shared Status:
                      {formData.salestl_shared_status === "1"
                        ? "Yes"
                        : formData.salestl_shared_status === "0"
                        ? "No"
                        : "N/A"}
                    </label>
                  </div>
                ) : null}
              </>
              {/* Shared Status End */}
            </div>
          ) : null}
          {/* Lead Status */}
          {lead.salestl_approval_status == "1" ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Lead Status</h3>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Lead Status:{Capitalize(formData.lead_status)}
                </label>
              </div>
            </div>
          ) : null}
          {/* Upload PO, or update Rejection Reason */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            {/* List of existing proposal documents */}
            <div className="mt-4">
              {isLoadingDocuments ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                </div>
              ) : poUploadedDocuments.length > 0 ? (
                <div className="space-y-2">
                  {poUploadedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <FiFile className="mr-2 text-blue-600" />
                        <span className="text-sm font-medium">{`PO ${index + 1}`}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-3">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiExternalLink />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No proposal documents uploaded yet.</p>
              )}
            </div>
          </div>
          {/* END Upload PO, or update Rejection Reason */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">HandOver Details</h3>
            <div>
              <label htmlFor="amc-or-project-select" className="block text-xs font-medium text-gray-700 mb-1">Project Or AMC</label>
              <select
                id="amc-or-project-select" // Added id for accessibility
                name="amc_or_project"
                value={formData.amc_or_project}
                onChange={(e) => handleTypeChange("amc_or_project", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Please select</option>
                <option value="amc">AMC</option>
                <option value="project">Project</option>
              </select>
            </div>
            {formData.amc_or_project === "project" && (
              <>
                {existingProject ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Existing Project</label>
                    <div className="flex items-center gap-2">
                      {isEditingProjectTitle ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editedProjectTitle}
                            onChange={(e) => setEditedProjectTitle(e.target.value)}
                            className="flex-1 text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter project title"
                          />
                          <button
                            type="button"
                            onClick={handleProjectTitleEdit}
                            disabled={loading}
                            className="px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingProjectTitle(false)
                              setEditedProjectTitle(existingProject.projectName)
                            }}
                            className="px-3 py-2 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                            {existingProject.projectName}
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEditingProjectTitle(true)}
                            className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                          >
                            Edit Title
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Project ID: {existingProject.projectId} | Created:{" "}
                      {new Date(existingProject.createdAt).toLocaleDateString()} |
                      {existingProject.hasExistingBOQ ? " Has BOQ" : " No BOQ"}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="project-name-select" className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
                    <select
                      id="project-name-select" // Added id for accessibility
                      name="project_name"
                      value={project.project_name}
                      onChange={(e) => handleTypeChange("project_name", e.target.value)}
                      className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Please select</option>
                      <option value={lead.client_name}>{lead.client_name}</option>
                      <option value={lead.middle_man_client_name}>{lead.middle_man_client_name}</option>
                      <option value={lead.architect_client_name}>{lead.architect_client_name}</option>
                      <option value={lead.mep_client_name}>{lead.mep_client_name}</option>
                      <option value="other">Other</option>
                    </select>
                    {showCustomInput && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Enter custom project name"
                          value={project.custom_project_name}
                          onChange={(e) => handleTypeChange("custom_project_name", e.target.value)}
                          className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* BOQ Section - Only show for projects */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-700">Bill of Quantities (BOQ)</label>
                    {!showBOQSelector && (
                      <button
                        type="button"
                        onClick={() => setShowBOQSelector(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                      >
                        {boqData || (existingProject && existingProject.hasExistingBOQ) ? "Edit BOQ" : "Create BOQ"}
                      </button>
                    )}
                  </div>
                  {/* Show BOQ Selector */}
                  {showBOQSelector && (
                    <ProductBOQSelector
                      projectId={existingProject ? existingProject.projectId : lead.id}
                      onSave={handleBOQSave}
                      leadProductTypes={producttypelist}
                      existingBOQ={existingBOQData}
                      isEditMode={existingProject && existingProject.hasExistingBOQ}
                      currentUserId={userId}
                      projectSalesTlId={lead.employee_assigned_to_sales_tl?.id}
                      onBOQItemStatusUpdateSuccess={checkExistingProject} // Pass the refresh function
                    />
                  )}
                  {/* Show BOQ Summary if data exists */}
                  {(boqData || (existingProject && existingProject.hasExistingBOQ)) && !showBOQSelector && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {existingProject && existingProject.hasExistingBOQ ? "Existing BOQ" : "BOQ Created"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowBOQSelector(true)}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          Edit BOQ
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        {boqData
                          ? `${boqData.items.length} product(s) in BOQ`
                          : existingProject && existingProject.boq
                          ? `${existingProject.boq.items.length} product(s) in BOQ`
                          : "BOQ data available"}
                      </div>
                      {boqData && boqData.items && (
                        <div className="mt-2 space-y-1">
                          {boqData.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              • {item.productName || "Product"} - Qty: {item.qty} {item.uom}
                            </div>
                          ))}
                          {boqData.items.length > 3 && (
                            <div className="text-xs text-gray-500">... and {boqData.items.length - 3} more items</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Warning if no BOQ for project */}
                  {formData.amc_or_project === "project" &&
                    !boqData &&
                    !(existingProject && existingProject.hasExistingBOQ) && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mt-2">
                        <div className="flex items-center">
                          <FiAlertCircle className="text-yellow-600 mr-2" size={16} />
                          <span className="text-xs text-yellow-800">
                            A BOQ is required for project handover. Please create a BOQ before submitting.
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                "HandOver"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default SalesTLHandOverForm