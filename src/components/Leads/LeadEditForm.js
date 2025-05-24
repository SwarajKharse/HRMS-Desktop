"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { FiX, FiCalendar, FiUpload, FiFile, FiExternalLink } from "react-icons/fi"
import { authService } from "../../services/authService"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"

function LeadEditForm({ lead, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  let userId = ""
  if (user) {
    userId = user.userId
  }

  const allIds = lead.lead_proposal_type !== null ? lead.lead_proposal_type.map((item) => item.id) : []

  const [formData, setFormData] = useState({
    ...lead,
    proposal_type: allIds || [],
    lead_proposal_type: lead.lead_proposal_type,
    employee_updatedby: {
      id: userId,
    },
  })

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

  // In the LeadEditForm component, add a new state for storing uploaded documents
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [poUpload, setPoUploads] = useState(false)
  const [poUploadedDocuments, setPoUploadedDocuments] = useState(false)

  

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

  // Add a function to fetch uploaded documents for the lead
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

  // Add useEffect to fetch documents when the component mounts or lead changes
  useEffect(() => {
    if ((activeTab === "sse-inprogress-leads" ||  activeTab === "assigned-leads")  && lead && lead.id) {
      fetchUploadedDocuments()
    }

    if (activeTab === 'salestl-won-leads' && lead && lead.id) {
      fetchUploadedPOs()
    }
  }, [activeTab, lead])

  // Add a function to handle document upload
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        proposal_document: file,
      })
      setProposalDocumentName(file.name)
    }
  }


  const handlePOUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        lead_po: file,
      })
      setPoUploads(file.name)
    }
  }

  // Function to trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

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
          className={`${
            checked ? "translate-x-4" : "translate-x-0.5"
          } inline-block transform rounded-full bg-white transition-transform ${
            size === "small" ? "h-3 w-3" : "h-5 w-5"
          }`}
        />
      </button>
    )
  }

  async function getCheckInSelfiePosition(position) {
    var url = "https://www.google.com/maps/search/?api=1&query="
    if (position.coords.latitude && position.coords.longitude) {
      url = url + position.coords.latitude + "," + position.coords.longitude
      await setCheckInSelfieLocation(url)
      //return url;
    }
  }

  function getCheckOutSelfiePosition(position) {
    var url = "https://www.google.com/maps/search/?api=1&query="

    if (position.coords.latitude && position.coords.longitude) {
      url = url + position.coords.latitude + "," + position.coords.longitude
      setCheckOutSelfieLocation(url)
    }
  }

  const [showProposalTypeDropdown, setShowProposalTypeDropdown] = useState(false)

  // Add click outside handler to close dropdown
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

  const handleProductTypeSelect = (id) => {
    let updatedProposalTypes
    if (formData.proposal_type.includes(id)) {
      updatedProposalTypes = formData.proposal_type.filter((item) => item !== id)
    } else {
      updatedProposalTypes = [...formData.proposal_type, id]
    }

    let finalProductType = []
    finalProductType = updatedProposalTypes.map((id, i) => {
      return {
        id: id,
      }
    })

    console.log(updatedProposalTypes)
    console.log(finalProductType)

    setFormData({
      ...formData,
      proposal_type: updatedProposalTypes,
      lead_proposal_type: finalProductType,
    })

    // Don't close the dropdown after selection
    // This allows selecting multiple items
  }

  const handleRemoveProductType = (id) => {
    const updatedProductTypes = formData.proposal_type.filter((item) => item !== id)
    let finalProductType = []
    finalProductType = formData.proposal_type.map((id, i) => {
      return {
        id: id,
      }
    })

    console.log(finalProductType)
    setFormData({
      ...formData,
      proposal_type: updatedProductTypes,
      lead_proposal_type: finalProductType,
    })
  }

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

      if (activeTab == "assigned-leads") {
        const [leadSource, leadType, leadProductType] = await Promise.all([
          leadService.getLeadSourceList(),
          leadService.getLeadTypeList(),
          leadService.getLeadProductTypeList(),
        ])
        setSourcelist(leadSource)
        setTypelist(leadType)
        setProductTypelist(leadProductType)
      }

      if (activeTab == "assign-leads-to-bdm") {
        const [bdmdata, leadSource, leadType, leadProductType] = await Promise.all([
          leadService.getBDMList(),
          leadService.getLeadSourceList(),
          leadService.getLeadTypeList(),
          leadService.getLeadProductTypeList(),
        ])
        console.log("bdmdata")
        console.log(bdmdata)
        setSourcelist(leadSource)
        setTypelist(leadType)
        setProductTypelist(leadProductType)
        setBDMList(bdmdata)
      }

      if (
        activeTab === "bdm-assigned-field-visit" ||
        activeTab === "sse-inprogress-leads" ||
        activeTab === "sse-won-leads" ||
        activeTab === "salestl-won-leads"
      ) {
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

  const isVisitTodayOrPast = (visit_scheduled_date) => {
    if (!visit_scheduled_date) return false

    const visitDate = new Date(visit_scheduled_date)
    const today = new Date()

    // Reset time part for accurate date comparison
    visitDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    return visitDate <= today
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    console.log(name + " *********** " + value)
    console.log(e.target.value)

    // Handle Assigned SSE Changes
    if (name === "assigned_sse") {
      setFormData({
        ...formData,
        architectFirmDetails: lead.architectFirmDetails,
        middleManDetails: lead.middleManDetails,
        pmcFirmDetails: lead.pmcFirmDetails,
        mepFirmDetails: lead.mepFirmDetails,
        additionalDetails: lead.additionalDetails,
        assigned_sse: {
          id: value,
        },
      })
    }

    // Handle Assigned BDM Changes
    if (name === "assigned_bdm") {
      setFormData({
        ...formData,
        architectFirmDetails: lead.architectFirmDetails,
        middleManDetails: lead.middleManDetails,
        pmcFirmDetails: lead.pmcFirmDetails,
        mepFirmDetails: lead.mepFirmDetails,
        additionalDetails: lead.additionalDetails,
        assigned_bdm: {
          id: value,
        },
      })
    }

    // Handle file uploads
    else if (name === "check_in_selfie") {
      const file = e.target.files[0]
      if (file) {
        var locationURL = ""
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            await getCheckInSelfiePosition(position)
            console.log("CHeck00 IN Location URL is -- ")
          })
        }

        setFormData({
          ...formData,
          check_in_selfie: file,
          checkin_selfie_location_url: checkInSelfieLocationURL,
        })

        setCheckInSelfieUploaded(true)
        // Create preview URL
        const reader = new FileReader()
        reader.onloadend = () => {
          setCheckInPreview(reader.result)
        }
        reader.readAsDataURL(file)
      }
    } else if (name === "check_out_selfie") {
      const file = e.target.files[0]
      if (file) {
        setFormData({
          ...formData,
          check_out_selfie: file,
        })

        // Create preview URL
        const reader = new FileReader()
        reader.onloadend = () => {
          setCheckOutPreview(reader.result)
        }
        reader.readAsDataURL(file)
      }
    } else if (name === "bdm_client_feedback_form") {
      const file = e.target.files[0]
      if (file) {
        setFormData({
          ...formData,
          bdm_client_feedback_form: file,
        })
        setFeedbackFormName(file.name)
      }
    } else if (name === "bdm_client_visit_report") {
      const file = e.target.files[0]
      if (file) {
        setFormData({
          ...formData,
          bdm_client_visit_report: file,
        })
        setVisitReportName(file.name)
      }
    } else if (name === "salestl_proposal") {
      const file = e.target.files[0]
      if (file) {
        setFormData({
          ...formData,
          salestl_proposal: file,
        })
        setProposalName(file.name)
      }
    } else if (name === "proposal_document") {
      const file = e.target.files[0]
      if (file) {
        setFormData({
          ...formData,
          proposal_document: file,
        })
        setProposalDocumentName(file.name)
      }
    }else if (name === "lead_po") {
      const file = e.target.files[0]
      if (file) {
        setFormData({
          ...formData,
          po_document: file,
        })
        setPoUploads(file.name)
      }
    }
      
    // Handle regular form fields
    else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }

    if (error) {
      console.log(error)
    }
  }

  const handleToggleFieldVisit = (e) => {
    // Update the local state for UI
    var newValue = e.target.value
    //setLocalFieldVisit(newValue)

    console.log("here " + newValue)

    // Update the form data
    setFormData({
      ...formData,
      need_of_field_visit: newValue,
    })
  }

  const handleProposalApproval = (e) => {
    // Update the local state for UI
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

  // Fix the showUploadProposal function to correctly check for rejected documents
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

  const handleSubmit = async (e) => {
    console.log("Submit CLicked " + activeTab)
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const processedData = {
        ...formData,
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

      setFormData(processedData)

      if (activeTab == "bdm-assigned-field-visit") {
        // Create FormData object to handle file uploads
        const formData = new FormData()

        // Add all the regular form data
        Object.keys(processedData).forEach((key) => {
          // Skip file fields, we'll add them separately
          if (
            key !== "check_in_selfie" &&
            key !== "check_out_selfie" &&
            key !== "bdm_client_feedback_form" &&
            key !== "bdm_client_visit_report"
          ) {
            // Handle date fields
            if (key === "visit_confirmation_call_date" || key === "visit_scheduled_date") {
              if (processedData[key]) {
                //var newDate = new Date(processedData[key]).toISOString().substr(0, 19);
                //console.log("AAAAAAAAAAAAAAAAAAAAAA");
                //console.log(newDate);
                formData.append(key, processedData[key])
              }
            }
            // Handle nested objects
            else if (typeof processedData[key] === "object" && processedData[key] !== null) {
              formData.append(key, JSON.stringify(processedData[key]))
            }
            // Handle regular fields
            else {
              formData.append(key, processedData[key])
            }
          }
        })

        // Add file uploads if they exist
        if (processedData.check_in_selfie) {
          formData.append("check_in_selfie_file", processedData.check_in_selfie)
          /* var locationUrl = "";
            if (navigator.geolocation) {
              await navigator.geolocation.getCurrentPosition((position) => {  
                locationUrl = getCheckInSelfiePosition(position)
                console.log("Location URL Inside "+locationUrl);
              })
          }
          console.log("Location URL is "+locationUrl)
          await formData.append("checkin_selfie_location_url",locationUrl) */
        }

        if (processedData.check_out_selfie) {
          formData.append("check_out_selfie_file", processedData.check_out_selfie)
          //formData.append("checkout_selfie_upload_time", date)

          if (navigator.geolocation) {
            await navigator.geolocation.getCurrentPosition((position) => {
              const locationURL = getCheckInSelfiePosition(position)
              console.log("Location URL is -- " + locationURL)
              formData.append("checkout_selfie_location_url", locationURL)
            })
          }
          //formData.append("checkout_selfie_location",checkOutSelfieLocation)
        }

        if (processedData.bdm_client_feedback_form) {
          formData.append("bdm_client_feedback_form", processedData.bdm_client_feedback_form)
        }

        if (processedData.bdm_client_visit_report) {
          formData.append("bdm_client_visit_report", processedData.bdm_client_visit_report)
        }

        //formData.append("bdm_visit_remarks", processedData.bdm_visit_remarks)
        formData.append("flag", "bdm-field-visit")

        // Use the FormData object for the API call
        await leadService.updateBDMFieldVisit(lead.id, formData)

      } else if (activeTab === "assigned-leads") {
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


        formData.append("flag", "assigned-leads")

        // Use the FormData object for the API call
        await leadService.updateSalesTLProposalApproval(lead.id, formData)

      }else if (activeTab === "sse-inprogress-leads") {
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
      } else if (activeTab === "salestl-won-leads") {
        // Create FormData object to handle file uploads
        const formData = new FormData()

        // Add all the regular form data
        Object.keys(processedData).forEach((key) => {
          // Skip file fields, we'll add them separately
          if (key != "po_document") {
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
        if (processedData.lead_po) {
          formData.append("po_document", processedData.lead_po)
        }

        formData.append("flag", "salestl-won-leads")

        // Use the FormData object for the API call
        await leadService.updatePOorRejectionReason(lead.id, formData)

        // Refresh the document list after upload
        //await fetchUploadedPOs()
      }else {
        // For other tabs, use the existing approach
        if (activeTab == "unassigned-leads") {
          var processedData1 = {
            ...processedData,
            assigned_sse: {
              id: processedData.assigned_sse,
            },
          }
          console.log("processedData")
          console.log(processedData1)
          await leadService.updateLead(lead.id, processedData1, "assign-sse")
        }
        if (activeTab == "sse-new-leads") await leadService.updateLead(lead.id, processedData, "update-field-info")

        if (activeTab == "assign-leads-to-bdm") {
          await leadService.updateLead(lead.id, processedData, "assign-leads-to-bdm")
        }
      }

      await onSubmit() // Wait for parent component to handle the response
      onClose() // Only close after successful submission and parent handling
    } catch (err) {
      console.log(err)
      setError(err.message || "Failed to update lead")
      window.scrollTo(0, 0) // Scroll to top to show error
    } finally {
      setLoading(false)
    }
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

  const matchingLabels = (id, producttypelist) => {
    let newlabel = ""
    if (id !== null && id !== "") {
      // Find the matching item instead of mapping through all items
      const matchingItem = producttypelist.find((item) => item.id === id.id)
      // If a matching item is found, use its label
      if (matchingItem) {
        newlabel = matchingItem.label.replace(/,/g, "") // Remove all commas
      }
    }
    return newlabel
  }

  // File input component
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
                  : name === 'lead_po' && poUpload ? poUpload  
                    : name === "proposal_document" && proposalDocumentName
                      ? proposalDocumentName
                      : "No file chosen"}
        </span>
      </div>
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
                  Product Type : {"  "}
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

              {lead.employee !== null && lead.employee.firstName !== null ?
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created By :
                  {"  "+lead.employee.firstName+"  "+lead.employee.lastName}
                </label>
                </div>
              : null}
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
                        {/* <TableHeader> # </TableHeader> */}
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Phone</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Designation</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lead.additionalDetails.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {/* <td>{idx}</td> */}
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
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {lead.middleManDetails && lead.middleManDetails.length > 0 && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        {/* <TableHeader> # </TableHeader> */}
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Phone no</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Designation</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lead.middleManDetails.map((mrow, midx) => (
                        <tr key={midx} className="hover:bg-gray-50">
                          {/* <td>{idx}</td> */}
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
                        {/* <TableHeader> # </TableHeader> */}
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Phone no</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Designation</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lead.architectFirmDetails.map((mrow, midx) => (
                        <tr key={midx} className="hover:bg-gray-50">
                          {/* <td>{idx}</td> */}
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
                        {/* <TableHeader> # </TableHeader> */}
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Phone no</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Designation</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lead.mepFirmDetails.map((mrow, midx) => (
                        <tr key={midx} className="hover:bg-gray-50">
                          {/* <td>{idx}</td> */}
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
                        {/* <TableHeader> # </TableHeader> */}
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Phone no</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>Designation</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lead.pmcFirmDetails.map((mrow, midx) => (
                        <tr key={midx} className="hover:bg-gray-50">
                          {/* <td>{idx}</td> */}
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

          {activeTab == "unassigned-leads" ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Assign SSE</h3>
              <div>
                <label className="text-sm font-medium text-gray-700">Assign SSE:</label>
                <select
                  name="assigned_sse"
                  value={formData.assigned_sse !== null ? formData.assigned_sse.id : ""}
                  onChange={(e) => handleChange(e)}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                  style={{ display: "inline" }}
                >
                  <option value="">Select Type</option>
                  {ssedata.map((country, i) => {
                    return (
                      <option key={i} value={country.id}>
                        {country.firstName + " " + country.lastName}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          ) : null}

          {activeTab == "sse-new-leads" ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Field Visit Details</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Need of Field Visit:</label>
                {/* <Toggle checked={localNeedOfFieldVisit} onChange={handleToggleFieldVisit} /> */}
                <select
                  name="need_of_field_visit"
                  //value={formData.need_of_field_visit || ""}
                  value={formData.need_of_field_visit !== null ? formData.need_of_field_visit : ""}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                  onChange={(e) => handleToggleFieldVisit(e)}
                >
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
                  value={formData.need_of_field_visit_remarks || ""}
                  onChange={handleFieldVisitRemarksChange}
                ></textarea>
              </div>
            </div>
          ) : null}

          {activeTab == "assign-leads-to-bdm" ? (
            <>
              <div className="space-y-4 rounded-lg bg-white border p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Details Filled By SSE</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    <b>Remarks:</b> {lead.need_of_field_visit_remarks}
                  </label>
                </div>
              </div>

              <div className="space-y-4 rounded-lg bg-white border p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Assign BDM</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700">Assign BDM:</label>
                  <select
                    name="assigned_bdm"
                    value={formData.assigned_bdm !== null ? formData.assigned_bdm.id : ""}
                    //value={formData.assigned_bdm.id || ""}
                    onChange={(e) => handleChange(e)}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                    style={{ display: "inline" }}
                  >
                    <option value="">Select Type</option>
                    {bdmdata.map((country, i) => {
                      return (
                        <option key={i} value={country.id}>
                          {country.firstName + " " + country.lastName}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              {/* Lead Status */}
              {lead.salestl_shared_status === "1" ? (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Lead Status</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Lead Status:</label>
                    <select
                      name="lead_status"
                      //value={formData.need_of_field_visit || ""}
                      value={formData.lead_status !== null ? formData.lead_status : ""}
                      className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                      onChange={(e) => handleLeadStatus(e)}
                    >
                      <option value={null}>Please select</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
              ) : null}
              {/* Lead Status End */}
            </>
          ) : null}

          {activeTab === "bdm-assigned-field-visit" ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Field Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visit confirmation call date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Visit Confirmation Call Date:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="visit_confirmation_call_date"
                      value={formData.visit_confirmation_call_date || ""}
                      onChange={handleChange}
                      className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                {/* Visit scheduled date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Visit Scheduled Date:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="visit_scheduled_date"
                      value={formData.visit_scheduled_date || ""}
                      onChange={handleChange}
                      className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {isVisitTodayOrPast(formData.visit_scheduled_date) && (
                <>
                  {/* Check-in selfie */}
                  <div className="mt-4">
                    {lead.check_in_selfie && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Check-in Selfie:</label>
                        <img
                          src={lead.check_in_selfie || "/placeholder.svg"}
                          alt="Check-in preview"
                          className="h-24 w-auto object-cover rounded-md"
                        />
                      </div>
                    )}
                    {!lead.check_in_selfie && (
                      <>
                        <FileInput label="Check-in Selfie" name="check_in_selfie" onChange={handleChange} />
                        {checkInPreview && (
                          <div className="mt-2">
                            <img
                              src={checkInPreview || "/placeholder.svg"}
                              alt="Check-in preview"
                              className="h-24 w-auto object-cover rounded-md"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Fields that only show if check-in selfie is uploaded */}
              {isVisitTodayOrPast(formData.visit_scheduled_date) && lead.check_in_selfie && (
                <>
                  {/* Check-out selfie */}
                  {lead.check_out_selfie && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Check-out Selfie:</label>
                      <img
                        src={lead.check_out_selfie || "/placeholder.svg"}
                        alt="Check-out preview"
                        className="h-24 w-auto object-cover rounded-md"
                      />
                    </div>
                  )}
                  {!lead.check_out_selfie && (
                    <div className="mt-4">
                      <FileInput label="Check-out Selfie" name="check_out_selfie" onChange={handleChange} />
                      {checkOutPreview && (
                        <div className="mt-2">
                          <img
                            src={checkOutPreview || "/placeholder.svg"}
                            alt="Check-out preview"
                            className="h-24 w-auto object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visit report */}
                  {lead.bdm_client_visit_report && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Visit Report:</label>
                      <a
                        href={lead.bdm_client_visit_report}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        BDM Client Visit Report
                      </a>
                    </div>
                  )}
                  {isVisitTodayOrPast(formData.visit_scheduled_date) && !lead.bdm_client_visit_report && (
                    <div className="mt-4">
                      <FileInput
                        label="Upload Visit Report"
                        accept="application/pdf"
                        name="bdm_client_visit_report"
                        onChange={handleChange}
                      />
                      {visitReportName && (
                        <div className="mt-2">
                          <span>{visitReportName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proposal scope */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposal scope</label>
                    <select
                      name="proposal_scope"
                      value={formData.proposal_scope !== null ? formData.proposal_scope : ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option>Select Type</option>
                      {typelist.map((country, i) => {
                        return (
                          <option key={i} value={country.id}>
                            {country.label}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Type</label>
                    <div id="product-type-dropdown" className="relative mt-1">
                      <div
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 min-h-[42px] flex flex-wrap gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowProposalTypeDropdown(!showProposalTypeDropdown)
                        }}
                      >
                        {formData.proposal_type.length > 0 ? (
                          formData.proposal_type.map((id) => {
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
                      {showProposalTypeDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-300">
                          {producttypelist.map((item) => (
                            <div
                              key={item.id}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                                formData.proposal_type.includes(item.id) ? "bg-blue-50" : ""
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
                                  checked={formData.proposal_type.includes(item.id)}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    handleProductTypeSelect(item.id)
                                  }}
                                />
                                <span
                                  className={`block truncate ${formData.proposal_type.includes(item.id) ? "font-medium" : "font-normal"}`}
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

                  {/* Remarks */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Remarks:</label>
                    <textarea
                      name="bdm_visit_remarks"
                      value={
                        formData.bdm_visit_remarks !== null && formData.bdm_visit_remarks.toString().trim() !== "null"
                          ? formData.bdm_visit_remarks
                          : ""
                      }
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 min-h-[100px]"
                      placeholder="Enter any additional remarks..."
                    ></textarea>
                  </div>
                  {lead.bdm_client_feedback_form && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Client Feedback Form:</label>
                      <a
                        href={lead.bdm_client_feedback_form}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        BDM Client Feedback Form
                      </a>
                    </div>
                  )}
                  {!lead.bdm_client_feedback_form && (
                    <div className="mt-4">
                      <FileInput
                        label="Upload Client Feedback Form"
                        accept="application/pdf"
                        name="bdm_client_feedback_form"
                        onChange={handleChange}
                      />
                      {feedbackFormName && (
                        <div className="mt-2">
                          <span>{feedbackFormName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Client feedback form */}
            </div>
          ) : null}

          {/* File Uploads, list and approvals */}
          {activeTab === "assigned-leads" || activeTab === "sse-inprogress-leads" || activeTab === "salestl-won-leads" ? (
            <>
              {lead.need_of_field_visit === "1" ? (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">BDM Field Visit Data</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visit confirmation call date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Visit Confirmation Call Date: {lead.visit_confirmation_call_date}
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Visit Scheduled Date:: {lead.visit_scheduled_date}
                      </label>
                    </div>

                    {lead.check_in_selfie && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Check-in Selfie:</label>
                        <img
                          src={lead.check_in_selfie || "/placeholder.svg"}
                          alt="Check-in preview"
                          className="h-24 w-auto object-cover rounded-md"
                        />
                      </div>
                    )}

                    {lead.check_out_selfie && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Check-Out Selfie:</label>
                        <img
                          src={lead.check_out_selfie || "/placeholder.svg"}
                          alt="Check-in preview"
                          className="h-24 w-auto object-cover rounded-md"
                        />
                      </div>
                    )}

                    {lead.bdm_client_visit_report && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Visit Report:</label>
                        <a
                          href={lead.bdm_client_visit_report}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          BDM Client Visit Report
                        </a>
                      </div>
                    )}

                    {lead.bdm_client_feedback_form && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Client Feedback Form:</label>
                        <a
                          href={lead.bdm_client_feedback_form}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          BDM Client Feedback Form
                        </a>
                      </div>
                    )}

                    {lead.lead_proposal_type && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Proposal Type:
                          {lead.lead_proposal_type !== null
                            ? lead.lead_proposal_type.map((country, itr) => {
                                const ptlabel = matchingLabels(country, producttypelist).toString()
                                return itr !== lead.lead_proposal_type.length - 1
                                  ? ptlabel + ",  "
                                  : ptlabel.substring(0, ptlabel.length - 1)
                              })
                            : ""}
                        </label>
                      </div>
                    )}

                    {lead.proposal_scope && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Proposal Scope:
                          {typelist.map((country, i) => {
                            return country.id == lead.proposal_scope ? " " + country.label : ""
                          })}
                        </label>
                      </div>
                    )}

                    {lead.bdm_visit_remarks && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Remarks: {lead.bdm_visit_remarks}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {lead.need_of_field_visit !== null ? (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Proposal Approval</h3>

                  {/* Approve Proposal */}

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

                  {/* Approve Proposal commented the validation for recent changes - Sales TL - proposal approval always open   */}
                 {/*  {showProposalApproval() && ( */}
                    <div className="flex items-center gap-2 mt-4">
                      <label className="text-sm font-medium text-gray-700">Approve Proposal:</label>
                      <select
                        name="salestl_approval_status"
                        value={formData.salestl_approval_status !== null ? formData.salestl_approval_status : ""}
                        className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                        onChange={(e) => handleProposalApproval(e)}
                      >
                        <option value={null}>Please select</option>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                  {/* )} */}
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

                  
                  {/* Approve Proposal End */}

                  {/* Shared Status */}

                  {activeTab === 'salestl-won-leads' ? (
                    <>
                      {lead.salestl_approval_status == "1" ? (
                      <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Shared Status:
                            { formData.salestl_shared_status === "1" ? "Yes" : formData.salestl_shared_status === "0" ? "No" : "N/A"}</label>
                      </div>
                      ) : null
                      }
                    </>
                  ) : null}
                  {activeTab !== 'salestl-won-leads' ? (
                  <>
                    {lead.salestl_approval_status == "1" ? (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Shared Status:</label>
                        <select
                          name="salestl_shared_status"
                          //value={formData.need_of_field_visit || ""}
                          value={formData.salestl_shared_status !== null ? formData.salestl_shared_status : ""}
                          className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                          onChange={(e) => handleSharedStatus(e)}
                        >
                          <option value={null}>Please select</option>
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </select>
                      </div>
                      ) : null
                      }
                    </>
                  ) : null}
                  {/* Shared Status End */}
                </div>
              ) : null}

              {/* Lead Status */}

              {activeTab === 'salestl-won-leads' ? (
                <>
                  {lead.salestl_approval_status == "1" ? (
                  <div className="space-y-4 rounded-lg bg-white border p-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Lead Status</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Lead Status:{ Capitalize(formData.lead_status) }</label>
                    </div>
                  </div>
                  ) : null
                  }
                </>
              ) : null}

            {activeTab !== 'salestl-won-leads' ? (
              <>
              {lead.salestl_shared_status === "1" ? (
                <div className="space-y-4 rounded-lg bg-white border p-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Lead Status</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Lead Status:</label>
                    <select
                      name="lead_status"
                      //value={formData.need_of_field_visit || ""}
                      value={formData.lead_status !== null ? formData.lead_status : ""}
                      className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                      onChange={(e) => handleLeadStatus(e)}
                    >
                      <option value={null}>Please select</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
              ) : null}
              {/* Lead Status End */}
            </>
          ) : null}
          </>
          ) : null}

          {/* File Uploads, list and approvals End */}
          
          {/* Upload PO, or update Rejection Reason */}
          {activeTab === "salestl-won-leads" ? <>
              
            {lead.lead_status === "lost" ? ( 
              <div className="space-y-4 rounded-lg bg-white border p-4">
                {lead.lead_rejection_reason === null ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rejection Reason:</label>
                    <textarea
                      name="lead_rejection_reason"
                      className="mt-1 block w-full rounded-md border border-gray-300"
                      value={formData.lead_rejection_reason || ""}
                      onChange={handleLeadRejectionRemarksChange}
                    ></textarea>
                  </div>
                ) :
                  <label className="text-sm font-medium text-gray-700">Rejection Reason:  {lead.lead_rejection_reason
                  }</label>
              }
              </div>
                ) : null}
                
            {lead.lead_status === "won" ? ( 
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
                  <div className="mt-4">
                <input
                  type="file"
                  name="lead_po"
                  onChange={handlePOUpload}
                  accept="application/pdf"
                  className="hidden"
                  ref={fileInputRef}
                />
                <div className="flex flex-col space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Upload PO</label>
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
                        {poUpload ? poUpload : "No file chosen"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              ) : null} 
              {/* END Upload PO, or update Rejection Reason */}

            
          </> : null}
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            {activeTab === "unassigned-leads" ||
            activeTab === "sse-new-leads" ||
            activeTab === "assign-leads-to-bdm" ||
            (activeTab === "assigned-leads" && lead.need_of_field_visit !== null) ||
              activeTab === "sse-inprogress-leads" ||
              activeTab === 'salestl-won-leads' ||
            activeTab === "bdm-assigned-field-visit" ? (
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

export default LeadEditForm