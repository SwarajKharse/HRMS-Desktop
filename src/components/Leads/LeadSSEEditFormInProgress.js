import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { FiX, FiCalendar, FiUpload, FiTrash2,FiFile, FiExternalLink } from "react-icons/fi"
import { authService } from "../../services/authService"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"

function LeadSSEEditFormInProgress({ lead, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  let userId = ""
  if (user) {
    userId = user.userId
  }
  const allIds = lead.lead_product_type !== null ? lead.lead_product_type.map((item) => item.id) : []

  const [leadData, setLeadData] = useState({
    ...lead,
    date_recieved: lead.lead_recieved !== null ? lead.lead_recieved : new Date().toISOString().split("T")[0],
    product_type: allIds || [],
    lead_product_type: lead.lead_product_type,
    employee_updatedby: {
      id: userId,
    },
  })

  useEffect(() => {
    fetchUploadedDocuments()
  }, [activeTab, lead])

  // Add a function to handle document upload
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setLeadData({
        ...leadData,
        proposal_document: file,
      })
      setProposalDocumentName(file.name)
    }
  }


  // Add a function to fetch uploaded documents for the lead
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

  // Fix the showProposalApproval function to correctly check for pending documents
  const showProposalApproval = () => {
    // Only show approval option if there's at least one pending document
    if (activeTab === 'assigned-leads') { 
      let flag = uploadedDocuments.some((doc) => doc.status === null);
      console.log("New Flag is  " + flag);
      return flag
    }
    return false
  }

  const handleProposalApproval = (e) => {
    // Update the local state for UI
    var newValue = e.target.value
    setLeadData({
      ...leadData,
      salestl_approval_status: newValue,
    })
  }

  const [checkInPreview, setCheckInPreview] = useState(lead.check_in_selfie_url || "")
  const [checkOutPreview, setCheckOutPreview] = useState(lead.check_out_selfie_url || "")
  const [feedbackFormName, setFeedbackFormName] = useState(lead.client_feedback_form_name || "")
  const [visitReportName, setVisitReportName] = useState(lead.bdm_client_visit_report || "")
  const [proposalName, setProposalName] = useState(lead.salestl_proposal || "")
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
  const [rows, setRows] = useState(leadData.additionalDetails || null);
  const [middleManrows, setMiddleManRows] = useState(leadData.middleManDetails || null);
  const [architectfirm, seArchitectFirm] = useState(leadData.architectFirmDetails || null);
  const [mepFirm, setMepFirm] = useState(leadData.mepFirmDetails || null);
  const [pmcFirm, setPmcFirm] = useState(leadData.pmcFirmDetails || null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [proposalDocumentName, setProposalDocumentName] = useState("")

  // Initialize form data when employee prop changes

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
          className={`${checked ? "translate-x-4" : "translate-x-0.5"
            } inline-block transform rounded-full bg-white transition-transform ${size === "small" ? "h-3 w-3" : "h-5 w-5"
            }`}
        />
      </button>
    )
  }


  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false)

  // Add click outside handler to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      const dropdown = document.getElementById("product-type-dropdown")
      if (showProductTypeDropdown && dropdown && !dropdown.contains(event.target)) {
        setShowProductTypeDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setShowProductTypeDropdown])


  const handleProductTypeSelect = (id) => {
    let updatedProposalTypes
    if (leadData.product_type.includes(id)) {
      updatedProposalTypes = leadData.product_type.filter((item) => item !== id)
    } else {
      updatedProposalTypes = [...leadData.product_type, id]
    }

    let finalProductType = [];
    finalProductType = (updatedProposalTypes.map((id, i) => {
      return {
        id: id
      }
    }))


    console.log(updatedProposalTypes);
    console.log(finalProductType);

    setLeadData({
      ...leadData,
      product_type: updatedProposalTypes,
      lead_product_type: finalProductType
    })

    // Don't close the dropdown after selection
    // This allows selecting multiple items
  }

  const handleRemoveProductType = (id) => {
    const updatedProductTypes = leadData.product_type.filter((item) => item !== id)
    let finalProductType = [];
    finalProductType = (leadData.product_type.map((id, i) => {
      return {
        id: id
      }
    }))

    console.log(finalProductType);
    setLeadData({
      ...leadData,
      product_type: updatedProductTypes,
      lead_product_type: finalProductType
    })
  }

  // Function to trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
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


    } catch (err) {
      setError("Failed to load departments and designations")
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }

  const showUploadProposal = () => {
    let flag = 0;
    let returnV = false;
    if (activeTab === 'sse-inprogress-leads') {
      uploadedDocuments.map((doc, index) => (
        doc.status === '0' ? flag = (flag + 1) : 0
      ));

      if ((uploadedDocuments.length - 1) === flag) {
        return false
      } else {
        return true;
      }
    }
    return false;
  }


  const handleSelectChange = (event) => {
    let name = event.target.name;
    let value = event.target.value;

    if (name === "date_recieved") setLeadData({ ...leadData, date_recieved: value, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "lead_source") setLeadData({ ...leadData, lead_source: value, date_recieved: leadData.date_recieved, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "lead_priority") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, lead_priority: value, lead_source: leadData.lead_source, lead_type: leadData.lead_type, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "lead_type") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, lead_type: value, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "product_type") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: value, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: value, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: value, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: value, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "middle_man_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: value, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "middle_man_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: value, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "middle_man_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: value, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "architect_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: value, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "architect_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: value, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "architect_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: value, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "mep_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: value, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "mep_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: value, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "mep_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: value, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "pmc_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: value, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "pmc_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: value, pmc_office_location: leadData.pmc_office_location });

    if (name === "pmc_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: value });

    //console.log(leadData);
  };


  const handleFieldVisitRemarksChange = (e) => {
    const { value } = e.target
    setLeadData({
      ...leadData,
      need_of_field_visit_remarks: value,
    })
  };


  const removeRow = (id, e) => {
    e.preventDefault();
    setRows(rows.filter((row) => row.id !== id));
  };

  const removeMiddleManRow = (id, e) => {
    e.preventDefault();
    setMiddleManRows(middleManrows.filter((row) => row.id !== id));
  };

  const removeArchitectRow = (id, e) => {
    e.preventDefault();
    seArchitectFirm(architectfirm.filter((row) => row.id !== id));
  };

  const removeMEPRow = (id, e) => {
    e.preventDefault();
    setMepFirm(mepFirm.filter((row) => row.id !== id));
  };

  const removePMCRow = (id, e) => {
    e.preventDefault();
    setPmcFirm(pmcFirm.filter((row) => row.id !== id));
  };


  const handleChange = (id, event) => {

    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = rows.map((row) => {
      if (row.id === id) {


        if (name === "contact_person_name") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: value, contact_person_phonenumber: row.contact_person_phonenumber, contact_person_email: row.contact_person_email, contact_person_designation: row.contact_person_designation };

        if (name === "contact_person_phonenumber") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: row.contact_person_name, contact_person_phonenumber: value, contact_person_email: row.contact_person_email, contact_person_designation: row.contact_person_designation };

        if (name === "contact_person_email") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: row.contact_person_name, contact_person_phonenumber: row.contact_person_phonenumber, contact_person_email: value, contact_person_designation: row.contact_person_designation };

        if (name === "contact_person_designation") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: row.contact_person_name, contact_person_phonenumber: row.contact_person_phonenumber, contact_person_email: row.contact_person_email, contact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setRows(updatedRows);
  };


  const handleMiddleManChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = middleManrows.map((row) => {
      if (row.id === id) {

        if (name === "mcontact_person_name") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: value, mcontact_person_phonenumber: row.mcontact_person_phonenumber, mcontact_person_email: row.mcontact_person_email, mcontact_person_designation: row.mcontact_person_designation };

        if (name === "mcontact_person_phonenumber") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: row.mcontact_person_name, mcontact_person_phonenumber: value, mcontact_person_email: row.mcontact_person_email, mcontact_person_designation: row.mcontact_person_designation };

        if (name === "mcontact_person_email") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: row.mcontact_person_name, mcontact_person_phonenumber: row.mcontact_person_phonenumber, mcontact_person_email: value, mcontact_person_designation: row.mcontact_person_designation };

        if (name === "mcontact_person_designation") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: row.mcontact_person_name, mcontact_person_phonenumber: row.mcontact_person_phonenumber, mcontact_person_email: row.mcontact_person_email, mcontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setMiddleManRows(updatedRows);
  };

  const handleArchitectChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = architectfirm.map((row) => {
      if (row.id === id) {

        if (name === "arcontact_person_name") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: value, arcontact_person_phonenumber: row.arcontact_person_phonenumber, arcontact_person_email: row.arcontact_person_email, arcontact_person_designation: row.arcontact_person_designation };

        if (name === "arcontact_person_phonenumber") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: row.arcontact_person_name, arcontact_person_phonenumber: value, arcontact_person_email: row.arcontact_person_email, arcontact_person_designation: row.arcontact_person_designation };

        if (name === "arcontact_person_email") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: row.arcontact_person_name, arcontact_person_phonenumber: row.arcontact_person_phonenumber, arcontact_person_email: value, arcontact_person_designation: row.arcontact_person_designation };

        if (name === "arcontact_person_designation") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: row.arcontact_person_name, arcontact_person_phonenumber: row.arcontact_person_phonenumber, arcontact_person_email: row.arcontact_person_email, arcontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    seArchitectFirm(updatedRows);
  };


  const handleMEPChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = mepFirm.map((row) => {
      if (row.id === id) {

        if (name === "mepcontact_person_name") return { ...row, mepcontact_person_name: value, mepcontact_person_phonenumber: row.mepcontact_person_phonenumber, mepcontact_person_email: row.mepcontact_person_email, mepcontact_person_designation: row.mepcontact_person_designation };

        if (name === "mepcontact_person_phonenumber") return { ...row, mepcontact_person_name: row.mepcontact_person_name, mepcontact_person_phonenumber: value, mepcontact_person_email: row.mepcontact_person_email, mepcontact_person_designation: row.mepcontact_person_designation };

        if (name === "mepcontact_person_email") return { ...row, mepcontact_person_name: row.mepcontact_person_name, mepcontact_person_phonenumber: row.mepcontact_person_phonenumber, mepcontact_person_email: value, mepcontact_person_designation: row.mepcontact_person_designation };

        if (name === "mepcontact_person_designation") return { ...row, mepcontact_person_name: row.mepcontact_person_name, mepcontact_person_phonenumber: row.mepcontact_person_phonenumber, mepcontact_person_email: row.mepcontact_person_email, mepcontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setMepFirm(updatedRows);
  };


  const handlePMCChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = pmcFirm.map((row) => {
      if (row.id === id) {
        if (name === "pmccontact_person_name") return { ...row, pmccontact_person_name: value, pmccontact_person_phonenumber: row.pmccontact_person_phonenumber, pmccontact_person_email: row.pmccontact_person_email, pmccontact_person_designation: row.pmccontact_person_designation };

        if (name === "pmccontact_person_phonenumber") return { ...row, pmccontact_person_name: row.pmccontact_person_name, pmccontact_person_phonenumber: value, pmccontact_person_email: row.pmccontact_person_email, pmccontact_person_designation: row.pmccontact_person_designation };

        if (name === "pmccontact_person_email") return { ...row, pmccontact_person_name: row.pmccontact_person_name, pmccontact_person_phonenumber: row.pmccontact_person_phonenumber, pmccontact_person_email: value, pmccontact_person_designation: row.pmccontact_person_designation };

        if (name === "pmccontact_person_designation") return { ...row, pmccontact_person_name: row.pmccontact_person_name, pmccontact_person_phonenumber: row.pmccontact_person_phonenumber, pmccontact_person_email: row.pmccontact_person_email, pmccontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setPmcFirm(updatedRows);
  };


  const addRow = (event) => {
    event.preventDefault();
    var length = rows.length + 1000;
    setRows([...rows, { id: length, contact_person_name: '', contact_person_phonenumber: '', contact_person_email: '', contact_person_designation: '' }]);
  };

  const addMiddleManRow = (event) => {
    event.preventDefault();
    var length = middleManrows.length + 1000;
    setMiddleManRows([...middleManrows, { id: length, mcontact_person_name: '', mcontact_person_phonenumber: '', mcontact_person_email: '', mcontact_person_designation: '' }]);
  };

  const addArchitectRow = (event) => {
    event.preventDefault();
    var length = architectfirm.length + 1000;
    seArchitectFirm([...architectfirm, { id: length, arcontact_person_name: '', arcontact_person_phonenumber: '', arcontact_person_email: '', arcontact_person_designation: '' }]);
  };


  const addMEPRow = (event) => {
    event.preventDefault();
    var length = mepFirm.length + 1000;
    setMepFirm([...mepFirm, { id: length, mepcontact_person_name: '', mepcontact_person_phonenumber: '', mepcontact_person_email: '', mepcontact_person_designation: '' }]);
  };

  const addPMCRow = (event) => {
    event.preventDefault();
    var length = pmcFirm.length + 1000;
    setPmcFirm([...pmcFirm, { id: length, pmccontact_person_name: '', pmccontact_person_phonenumber: '', pmccontact_person_email: '', pmccontact_person_designation: '' }]);
  };


  const handleSubmit = async (e) => {
    console.log("Submit CLicked " + activeTab)
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const updatedAdditionalRows = rows.map((row) => {
        if (row.id >= 1000) {
          return { ...row, id: null };
        } else {
          return row
        }
      });

      const updatedMiddleManRows = middleManrows.map((row) => {
        if (row.id >= 1000) {
          return { ...row, id: null };
        } else {
          return row
        }
      });

      const updatedArchitectRows = architectfirm.map((row) => {
        if (row.id >= 1000) {
          return { ...row, id: null };
        } else {
          return row
        }
      });

      const updatedPMC = pmcFirm.map((row) => {
        if (row.id >= 1000) {
          return { ...row, id: null };
        } else {
          return row
        }
      });

      const updatedMEP = mepFirm.map((row) => {
        if (row.id >= 1000) {
          return { ...row, id: null };
        } else {
          return row
        }
      });

      if (!leadData.product_type || leadData.product_type.length === 0) {
        setError(true)
        throw new Error("Please select at least one Product Type")
      }



      const processedData = {
        ...leadData,
        additionalDetails: updatedAdditionalRows,
        middleManDetails: updatedMiddleManRows,
        architectFirmDetails: updatedArchitectRows,
        pmcFirmDetails: updatedPMC,
        mepFirmDetails: updatedMEP,
        employee_updatedby: {
          id: userId,
        },
      }

      // Create FormData object to handle file uploads
      const formData = new FormData()

      // Add all the regular form data
      Object.keys(processedData).forEach((key) => {
        // Skip file fields, we'll add them separately
        if (key != "salestl_proposal" && key != "proposal_document") {
          if (typeof processedData[key] === "object" && processedData[key] !== null) {
            formData.append(key, JSON.stringify(processedData[key]))
          }
          // Handle regular fields
          else {
            formData.append(key, processedData[key])
          }
        }
      })

      // Add file uploads if they exist
      if (processedData.salestl_proposal) {
        formData.append("salestl_proposal_file", processedData.salestl_proposal)
      }

      // Add proposal document if it exists
      if (processedData.proposal_document) {
        formData.append("proposal_document", processedData.proposal_document)
        formData.append("document_type", "proposal")
      }

      formData.append("flag", "sse-assigned-leads")

      // Use the FormData object for the API call
      await leadService.updateSSEProposalApproval(lead.id, formData)

      // Refresh the document list after upload
      await fetchUploadedDocuments()

      //await leadService.updateLead(lead.id, processedData, "update-field-info");

      onClose() // Only close after successful submission and parent handle
    } catch (err) {
      console.log(err)
      setError(err.message || "Failed to update lead")
      window.scrollTo(0, 0) // Scroll to top to show error
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFieldVisit = (e) => {
    // Update the local state for UI
    var newValue = e.target.value
    setLeadData({
      ...leadData,
      need_of_field_visit: newValue,
    })
  }

  const Capitalize = (str) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const AssignSSE = (str) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }


  // Simple table header and cell components
  const TableHeader = ({ children }) => (
    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b flex-wrap">
      {children}
    </th>
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
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Lead</h2>
          <div className="flex justify-end">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <FiX size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-4 rounded-lg p-4 bg-white border">
            <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Recieved <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="date_recieved"
                  value={leadData.date_recieved}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source <span className="text-red-500">*</span></label>
                <select
                  name="lead_source"
                  value={leadData.lead_source}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">

                  <option value="">Select Type</option>
                  {sourcelist.map((country, i) => {
                    return <option key={i} value={country.id}>{country.label}</option>
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lead Priority <span className="text-red-500">*</span></label>
                <select
                  value={leadData.lead_priority}
                  onChange={handleSelectChange}
                  name="lead_priority" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Select Type</option>
                  <option value="cold">Cold</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lead Type <span className="text-red-500">*</span></label>
                <select
                  name="lead_type"
                  value={leadData.lead_type}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Select Type</option>
                  {typelist.map((country, i) => {
                    return <option key={i} value={country.id}>{country.label}</option>
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <div id="product-type-dropdown" className="relative mt-1">
                  <div
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 min-h-[42px] flex flex-wrap gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowProductTypeDropdown(!showProductTypeDropdown)
                    }}
                  >
                    {leadData.product_type.length > 0 ? (
                      leadData.product_type.map((id) => {
                        const item = producttypelist.find((item) => item.id === id)
                        return (
                          <span
                            key={id}
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center"
                          >
                            {item?.label}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveProductType(id)
                              }}
                              className="ml-1 text-blue-800 hover:text-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-gray-500">Select Proposal Types</span>
                    )}
                  </div>
                  {showProductTypeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-300">
                      {producttypelist.map((item) => (
                        <div
                          key={item.id}
                          className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${leadData.product_type.includes(item.id) ? "bg-blue-50" : ""
                            }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProductTypeSelect(item.id)
                          }}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 mr-2"
                              checked={leadData.product_type.includes(item.id)}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleProductTypeSelect(item.id)
                              }}
                            />
                            <span
                              className={`block truncate ${leadData.product_type.includes(item.id) ? "font-medium" : "font-normal"}`}
                            >
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {lead.employee !== null && lead.employee.firstName !== null ?
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Created By :
                    {"  " + lead.employee.firstName + "  " + lead.employee.lastName}
                  </label>
                </div>
                : null}
            </div>
          </div>
          {/* Basic Information Section End */}

          {/* Additional Details */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span className="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea name="client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.client_name}
                        onChange={handleSelectChange}>
                      </textarea>
                    </td>
                    <td>
                      <textarea
                        name="project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.project_location}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}

                      <td className="px-2 py-2">
                        <input type="text" name="contact_person_name"
                          value={row.contact_person_name}
                          onChange={(event) => handleChange(row.id, event,)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel" name="contact_person_phonenumber" value={row.contact_person_phonenumber}
                          onChange={(event) => handleChange(row.id, event,)}
                          pattern="[789][0-9]{9}"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>

                        <input type="email" name="contact_person_email"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          value={row.contact_person_email}
                          onChange={(event) => handleChange(row.id, event,)} />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input type="text"
                          name="contact_person_designation"
                          value={row.contact_person_designation}
                          onChange={(event) => handleChange(row.id, event,)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                      </td>
                      <td>
                        <button onClick={(event) => removeRow(row.id, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* Addition Details Section End */}

          {/* Middle Man Details */}
          <div className="space-y-4 bg-white border border border-t-indigo-500 border-b-indigo-500 p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Middle Man Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span className="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="middle_man_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.middle_man_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="middle_man_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.middle_man_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="middle_man_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.middle_man_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {middleManrows.map((mrow, midx) => (
                    <tr key={mrow.id} className="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="mcontact_person_name"
                          value={mrow.mcontact_person_name}
                          onChange={(event) => handleMiddleManChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="mcontact_person_phonenumber"
                          value={mrow.mcontact_person_phonenumber}
                          onChange={(event) => handleMiddleManChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="mcontact_person_email"
                          value={mrow.mcontact_person_email}
                          onChange={(event) => handleMiddleManChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="mcontact_person_designation"
                          value={mrow.mcontact_person_designation}
                          onChange={(event) => handleMiddleManChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removeMiddleManRow(mrow.id, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addMiddleManRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* Middle Man End */}

          {/* Architect Firm Details Section */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Architect Firm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span className="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="architect_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.architect_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="architect_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.architect_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="architect_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.architect_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {architectfirm.map((mrow, midx) => (
                    <tr key={mrow.id} className="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="arcontact_person_name"
                          value={mrow.arcontact_person_name}
                          onChange={(event) => handleArchitectChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="arcontact_person_phonenumber"
                          value={mrow.arcontact_person_phonenumber}
                          onChange={(event) => handleArchitectChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="arcontact_person_email"
                          value={mrow.arcontact_person_email}
                          onChange={(event) => handleArchitectChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="arcontact_person_designation"
                          value={mrow.arcontact_person_designation}
                          onChange={(event) => handleArchitectChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removeArchitectRow(mrow.id, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addArchitectRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* Architect Firm Details Section End */}

          {/* MEP Firm Details Section */}
          <div className="space-y-4 bg-white border border border-t-indigo-500 border-b-indigo-500 p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Consultant / MEP Firm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span className="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="mep_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.mep_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="mep_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.mep_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="mep_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.mep_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mepFirm.map((mrow, midx) => (
                    <tr key={mrow.id} className="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="mepcontact_person_name"
                          value={mrow.mepcontact_person_name}
                          onChange={(event) => handleMEPChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="mepcontact_person_phonenumber"
                          value={mrow.mepcontact_person_phonenumber}
                          onChange={(event) => handleMEPChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="mepcontact_person_email"
                          value={mrow.mepcontact_person_email}
                          onChange={(event) => handleMEPChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="mepcontact_person_designation"
                          value={mrow.mepcontact_person_designation}
                          onChange={(event) => handleMEPChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removeMEPRow(mrow.id, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addMEPRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* MEP Firm Details Section End */}

          {/* PMC Firm Details Section */}
          <div className="space-y-4 bg-white border border border-t-indigo-500 p-4">
            <h3 className="font-semibold text-lg border-b pb-2">PMC Firm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span className="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span className="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="pmc_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.pmc_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="pmc_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.pmc_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="pmc_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.pmc_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pmcFirm.map((mrow, midx) => (
                    <tr key={mrow.id} className="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="pmccontact_person_name"
                          value={mrow.pmccontact_person_name}
                          onChange={(event) => handlePMCChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="pmccontact_person_phonenumber"
                          value={mrow.pmccontact_person_phonenumber}
                          onChange={(event) => handlePMCChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="pmccontact_person_email"
                          value={mrow.pmccontact_person_email}
                          onChange={(event) => handlePMCChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="pmccontact_person_designation"
                          value={mrow.pmccontact_person_designation}
                          onChange={(event) => handlePMCChange(mrow.id, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removePMCRow(mrow.id, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addPMCRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* PMC Firm Details End */}

          {activeTab == "sse-new-leads" ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Field Visit Details</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Need of Field Visit:</label>
                {/* <Toggle checked={localNeedOfFieldVisit} onChange={handleToggleFieldVisit} /> */}
                <select
                  name="need_of_field_visit"
                  //value={leadData.need_of_field_visit || ""}
                  value={leadData.need_of_field_visit !== null ? leadData.need_of_field_visit : ""}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2" onChange={(e) => handleToggleFieldVisit(e)}>
                  <option value={null}>Please select</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Need of Field Visit Remarks:</label>
                <textarea
                  name="need_of_field_visit_remarks"
                  className="mt-1 block w-full rounded-md border border-gray-300"
                  value={leadData.need_of_field_visit_remarks || ""}
                  onChange={handleFieldVisitRemarksChange}
                ></textarea>
              </div>
            </div>
          ) : null}

          {(activeTab === "sse-inprogress-leads" || activeTab === "assigned-leads") && (
            <div className="space-y-4 rounded-lg bg-white border p-4 mt-4">
              <h4 className="font-semibold text-sm border-b pb-2">Proposal Documents</h4>

              {/* List of existing proposal documents */}
              <div className="mt-4">
                {isLoadingDocuments ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                  </div>
                ) : uploadedDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <FiFile className="mr-2 text-blue-600" />
                          <span className="text-sm font-medium">{doc.fileName || `Document ${index + 1}`}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-3">
                            {doc.status === null ? "Pending" : null}
                            {doc.status === "1" ? "Approved" : null}
                            {doc.status === "0" ? "Rejected" : null}
                          </span>

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

              {/* Upload new proposal document */}
              {showUploadProposal() && (
                <div className="mt-4">
                  <input
                    type="file"
                    name="proposal_document"
                    onChange={handleDocumentUpload}
                    accept="application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Upload Proposal Document</label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <FiUpload className="mr-2" />
                        Choose File
                      </button>
                      <span className="text-sm text-gray-500">
                        {proposalDocumentName ? proposalDocumentName : "No file chosen"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Approve Proposal */}
              {showProposalApproval() && (
                <div className="flex items-center gap-2 mt-4">
                  <label className="text-sm font-medium text-gray-700">Approve Proposal:</label>
                  <select
                    name="salestl_approval_status"
                    value={leadData.salestl_approval_status !== null ? leadData.salestl_approval_status : ""}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                    onChange={(e) => handleProposalApproval(e)}
                  >
                    <option value={null}>Please select</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {activeTab === "sse-inprogress-leads" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Approval Status:{" "}
                {lead.salestl_approval_status !== null && lead.salestl_approval_status === "1"
                  ? "Approved"
                  : null}
                {lead.salestl_approval_status !== null && lead.salestl_approval_status === "0"
                  ? "Not Approved"
                  : null}
                {lead.salestl_approval_status === null || lead.salestl_approval_status === ""
                  ? "Pending"
                  : null}
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            {activeTab == "unassigned-leads" ||
              activeTab == "sse-new-leads" ||
              activeTab == "assign-leads-to-bdm" ||
              (activeTab == "assigned-leads" && lead.need_of_field_visit !== null) ||
              "bdm-assigned-field-visit" ? (
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
                  "Update Lead"
                )}
              </button>
            ) : null}
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default LeadSSEEditFormInProgress

