"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiX, FiCalendar, FiUpload, FiFile, FiExternalLink } from "react-icons/fi"
import { authService } from "../../services/authService"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"

function ProjectLeadDetails({ lead, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    leadDetails: false, // Lead Details expanded by default
    projectDetails: true, // Project Details collapsed by default
  })

  let userId = ""
  if (user) {
    userId = user.userId
  }

  //const allIds = lead.lead_proposal_type !== null ? lead.lead_proposal_type.map((item) => item.id) : []

  const [formData, setFormData] = useState({
    ...lead,
    proposal_type: [],
    lead_proposal_type: lead.lead_proposal_type,
    employee_updatedby: {
      id: userId,
    },
  })

  // All your existing state variables
  const [checkInPreview, setCheckInPreview] = useState(lead.check_in_selfie_url || "")
  const [checkOutPreview, setCheckOutPreview] = useState(lead.check_out_selfie_url || "")
  const [feedbackFormName, setFeedbackFormName] = useState(lead.client_feedback_form_name || "")
  const [visitReportName, setVisitReportName] = useState(lead.bdm_client_visit_report || "")
  const [proposalName, setProposalName] = useState(lead.salestl_proposal || "")
  const [proposalDocumentName, setProposalDocumentName] = useState("")
  const [poName, setPOName] = useState([])
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])
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
  const [showProposalTypeDropdown, setShowProposalTypeDropdown] = useState(false)

  // Project Details state
  const [projectData, setProjectData] = useState({
    projectName: lead.project_name || "",
    projectDescription: lead.project_description || "",
    projectBudget: lead.project_budget || "",
    projectTimeline: lead.project_timeline || "",
    projectStatus: lead.project_status || "planning",
    projectManager: lead.project_manager || "",
    estimatedValue: lead.estimated_value || "",
    actualValue: lead.actual_value || "",
    startDate: lead.start_date || "",
    endDate: lead.end_date || "",
  })

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // All your existing useEffect and functions
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
    if (activeTab === "salestl-won-leads" && lead && lead.id) {
      fetchUploadedDocuments()
      fetchUploadedPOs()
    }
  }, [activeTab, lead])

  useEffect(() => {
    fetchDepartmentsAndDesignations()
  }, [authService.getUser().orgId])

  const fetchDepartmentsAndDesignations = async () => {
    try {
      const [leadSource, leadType, leadProductType] = await Promise.all([
        leadService.getLeadSourceList(),
        leadService.getLeadTypeList(),
        leadService.getLeadProductTypeList(),
      ])
      setSourcelist(leadSource)
      setTypelist(leadType)
      setProductTypelist(leadProductType)

      console.log(leadProductType);
      console.log(lead)

    } catch (err) {
      setError("Failed to load departments and designations")
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }

  // All your existing functions
  const handleChange = (e) => {
    const { name, value } = e.target

    console.log(name + " *********** " + value)

    // Handle regular form field
    setFormData({
      ...formData,
      [name]: value,
    })


    if (error) {
      console.log(error)
    }
  }

  // Handle project data changes
  const handleProjectChange = (e) => {
    const { name, value } = e.target
    setProjectData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleToggleFieldVisit = (e) => {
    var newValue = e.target.value
    setFormData({
      ...formData,
      need_of_field_visit: newValue,
    })
  }

  const handleProposalApproval = (e) => {
    var newValue = e.target.value
    setFormData({
      ...formData,
      salestl_approval_status: newValue,
    })
  }

  const handleSharedStatus = (e) => {
    var newValue = e.target.value
    setFormData({
      ...formData,
      salestl_shared_status: newValue,
    })
  }

  const handleLeadStatus = (e) => {
    var newValue = e.target.value
    setFormData({
      ...formData,
      lead_status: newValue,
    })
  }

  const handleFieldVisitRemarksChange = (e) => {
    const { value } = e.target
    setFormData({
      ...formData,
      need_of_field_visit_remarks: value,
    })
  }

  const handleLeadRejectionRemarksChange = (e) => {
    const { value } = e.target
    setFormData({
      ...formData,
      lead_rejection_reason: value,
    })
  }

  const handleProductTypeSelect = (id) => {
    let updatedProposalTypes
    if (formData.proposal_type.includes(id)) {
      updatedProposalTypes = formData.proposal_type.filter((item) => item !== id)
    } else {
      updatedProposalTypes = [...formData.proposal_type, id]
    }

    let finalProductType = []
    /* finalProductType = updatedProposalTypes.map((id, i) => {
      return {
        id: id,
      }
    }) */

    setFormData({
      ...formData,
      proposal_type: updatedProposalTypes,
      lead_proposal_type: finalProductType,
    })
  }

 

  const isVisitTodayOrPast = (visit_scheduled_date) => {
    if (!visit_scheduled_date) return false

    const visitDate = new Date(visit_scheduled_date)
    const today = new Date()

    visitDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    return visitDate <= today
  }

  /* const showUploadProposal = () => {
    let flag = 0
    if (activeTab === "sse-inprogress-leads") {
      uploadedDocuments.map((doc, index) => (doc.status === "0" ? (flag = flag + 1) : 0))

      if (uploadedDocuments.length - 1 === flag) {
        return false
      } else {
        return true
      }
    }
    return false
  } */


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const processedData = {
        ...formData,
        ...projectData,
        architectFirmDetails: lead.architectFirmDetails,
        middleManDetails: lead.middleManDetails,
        pmcFirmDetails: lead.pmcFirmDetails,
        mepFirmDetails: lead.mepFirmDetails,
        additionalDetails: lead.additionalDetails,
        created_at: lead.created_at,
        employee_updatedby: {
          id: userId,
        },
      }


      const formData = new FormData()
      Object.keys(processedData).forEach((key) => {
        if (key != "po_document") {
          if (typeof processedData[key] === "object" && processedData[key] !== null) {
            formData.append(key, JSON.stringify(processedData[key]))
          } else {
            formData.append(key, processedData[key])
          }
        }
      })

      if (processedData.lead_po) {
        formData.append("po_document", processedData.lead_po)
      }

      formData.append("flag", "salestl-won-leads")
      await leadService.updatePOorRejectionReason(lead.id, formData)

      await onSubmit()
      onClose()
    } catch (err) {
      console.log(err)
      setError(err.message || "Failed to update lead")
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
        <span className="text-sm text-gray-500">
          {name === "check_in_selfie" && checkInPreview
            ? "Image selected"
            : name === "check_out_selfie" && checkOutPreview
              ? "Image selected"
              : name === "bdm_client_feedback_form" && feedbackFormName
                ? feedbackFormName
                : name === "bdm_client_visit_report"
                  ? visitReportName
                  : name === "salestl_proposal" && proposalName
                    ? proposalName
                    : name === "lead_po" && poUpload
                      ? poUpload
                      : name === "proposal_document" && proposalDocumentName
                        ? proposalDocumentName
                        : "No file chosen"}
        </span>
      </div>
    </div>
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
                
              </div>
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
                  Assign Site Engineer <span className="text-red-500">*</span>
                </label>
                <select
                  name="lead_source"
                  value=""
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Engineer</option>
                  <option value="4">Gahininath  Maske</option>
                </select>
              </div>

              <div></div>

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
              (activeTab === "assigned-leads" && lead.need_of_field_visit !== null) ||
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
