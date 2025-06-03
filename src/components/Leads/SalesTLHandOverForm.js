"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { FiX, FiCalendar, FiUpload, FiFile, FiExternalLink, FiAlertCircle, FiCheck } from "react-icons/fi"
import { authService } from "../../services/authService"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"
import { projectService } from "../../services/projectService"

function SalesTLHandOverForm({ lead, activeTab, onClose, onSubmit }) {
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
  const [successMessage, setSuccessMessage] = useState(null)

  const [project, setProject] = useState({
    project_name: "",
    custom_project_name: "",
  })

  const [showCustomInput, setShowCustomInput] = useState(false)



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
    if ((activeTab === "sse-inprogress-leads" || activeTab === "assigned-leads") && lead && lead.id) {
      fetchUploadedDocuments()
    }

    if (activeTab === 'salestl-won-leads' && lead && lead.id) {
      fetchUploadedPOs()
    }
  }, [activeTab, lead])







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

  const handleSubmit = async (e) => {
    console.log("Submit CLicked " + activeTab)
    e.preventDefault()
    setLoading(true)
    setError("")
    const finalProjectName = project.project_name === "other" ? project.custom_project_name : project.project_name
    try {
      const processedData = {
        amc_or_project: formData.amc_or_project,
        lead: {
          id: lead.id
        },
        project_name: finalProjectName,
        employee_updatedby: {
          id: userId,
        },
      }

      setFormData(processedData)

      console.log("Processed Data is ");
      console.log(processedData)

      await projectService.createProject(processedData, lead.id);
      setSuccessMessage("Lead handover successfully")
      setTimeout(() => setSuccessMessage(null), 3000)

      /* if (activeTab === "salestl-won-leads") {
        // Create FormData object to handle file uploads
        const formData = new FormData()
        formData.append("flag", "salestl-won-leads")

        // Use the FormData object for the API call
        //await leadService.updatePOorRejectionReason(lead.id, formData)
        

      } */
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

  const handleTypeChange = (field, value) => {
    if (field === "project_name") {
      if (value === "other") {
        setShowCustomInput(true)
        setProject((prev) => ({
          ...prev,
          project_name: value,
          custom_project_name: "", // Reset custom input when switching to other
        }))
      } else {
        setShowCustomInput(false)
        setProject((prev) => ({
          ...prev,
          project_name: value,
          custom_project_name: "", // Clear custom input when not using other
        }))
      }
    } else if (field === "amc_or_project") {
      setFormData({
        ...formData,
        amc_or_project: value
      })
      console.log("Value is   " + value)
      console.log(formData)
    } else {
      setProject((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
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
          {name === 'lead_po' && poUpload ? poUpload : "No file chosen"}
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

        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">HandOver Lead</h2>
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
                    {"  " + lead.employee.firstName + "  " + lead.employee.lastName}
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

          {lead.need_of_field_visit !== null ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Proposal Approval</h3>
              {/* Shared Status */}
              <>
                {lead.salestl_approval_status == "1" ? (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Shared Status:
                      {formData.salestl_shared_status === "1" ? "Yes" : formData.salestl_shared_status === "0" ? "No" : "N/A"}</label>
                  </div>
                ) : null
                }
              </>
              {/* Shared Status End */}
            </div>
          ) : null}
          {/* Lead Status */}

          {lead.salestl_approval_status == "1" ? (
            <div className="space-y-4 rounded-lg bg-white border p-4">
              <h3 className="font-semibold text-lg border-b pb-2">Lead Status</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Lead Status:{Capitalize(formData.lead_status)}</label>
              </div>
            </div>
          ) : null
          }

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
              <label className="text-xs font-medium text-gray-700 mb-1 block">Project Or AMC</label>
              <select
                name="amc_or_project"
                value={formData.amc_or_project}
                onChange={(e) => handleTypeChange("amc_or_project", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200">
                <option value="">Please select</option>
                <option value="amc">AMC</option>
                <option value="project">Project</option>
              </select>
            </div>

            {formData.amc_or_project === 'project' ?
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Project Name</label>
                <select
                  name="project_name"
                  value={project.project_name}
                  onChange={(e) => handleTypeChange("project_name", e.target.value)}
                  className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200">
                  <option value="">Please select</option>
                  <option value="{lead.client_name}">{lead.client_name}</option>
                  <option value="{lead.middle_man_client_name}">{lead.middle_man_client_name}</option>
                  <option value="{lead.architect_client_name}">{lead.architect_client_name}</option>
                  <option value="{lead.mep_client_name}">{lead.mep_client_name}</option>
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
              : null}

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