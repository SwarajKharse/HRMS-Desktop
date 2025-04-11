import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiCalendar, FiUpload } from "react-icons/fi"
import { authService } from "../../services/authService"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"

function LeadEditForm({ lead, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()

  let userId = ""
  if (user) {
    userId = user.userId
  }

  const [formData, setFormData] = useState({
    ...lead,
    employee_updatedby: {
      id: userId,
    },
  })

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


  async function getCheckInSelfiePosition (position) {
    var url = "https://www.google.com/maps/search/?api=1&query=";
    if (position.coords.latitude && position.coords.longitude) {
      url = url + position.coords.latitude + "," + position.coords.longitude;
      await setCheckInSelfieLocation(url);
      //return url;
    }
  }

  function getCheckOutSelfiePosition(position) {
    var url = "https://www.google.com/maps/search/?api=1&query=";

    if (position.coords.latitude && position.coords.longitude) {
      url = url + position.coords.latitude + "," + position.coords.longitude;
      setCheckOutSelfieLocation(url);
    }
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
          leadService.getSSEList(),
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

      if(activeTab === "bdm-assigned-field-visit"){
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
        var locationURL = ""; 
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async(position) => {
            await getCheckInSelfiePosition(position)
            console.log("CHeck00 IN Location URL is -- ");
          })
          
        }    
        
        console.log("Location URL Outside111111 "+checkInSelfieLocationURL)
        setFormData({
          ...formData,
          check_in_selfie: file,
          checkin_selfie_location_url : checkInSelfieLocationURL
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
    }else if (name === "salestl_proposal") {
      const file = e.target.files[0]
      if (file) {
        setFormData({
          ...formData,
          salestl_proposal: file,
        })
        setProposalName(file.name)
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

    console.log("here "+newValue)

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

  const handleFieldVisitRemarksChange = (e) => {
    const { value } = e.target
    setFormData({
      ...formData,
      need_of_field_visit_remarks: value,
    })
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
        console.log("Inside IF")
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
              console.log("Location URL is -- " + locationURL);
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
        formData.append("flag", "bdm-field-visit");

        // Use the FormData object for the API call
        await leadService.updateBDMFieldVisit(lead.id, formData);
      } else if (activeTab == "assigned-leads" || activeTab === "sse-inprogress-leads") {
        console.log("Inside IF")
        // Create FormData object to handle file uploads
        const formData = new FormData()

        // Add all the regular form data
        Object.keys(processedData).forEach((key) => {
          // Skip file fields, we'll add them separately
          if (
              key != "salestl_proposal"
          ) {
            
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

        /* if (processedData.salestl_approval_status) {
          formData.append("salestl_approval_status", processedData.salestl_approval_status)
        } */
        
        formData.append("flag", "sse-assigned-leads");

        // Use the FormData object for the API call
        await leadService.updateSSEProposalApproval(lead.id, formData);
      } else {
        // For other tabs, use the existing approach
        if (activeTab == "unassigned-leads") {
          var processedData1 = {
            ...processedData,
            assigned_sse: {
              id: processedData.assigned_sse
            }
          }
          console.log("processedData");
          console.log(processedData1);
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

  // File input component
  const FileInput = ({ label, name, onChange, accept = "image/*", required = false }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center">
          <FiUpload className="mr-2" />
          <span>Choose File</span>
          <input type="file" name={name} onChange={onChange} accept={accept} className="hidden" required={required} />
        </label>
        <span className="text-sm text-gray-500">
          {/* {name === "check_in_selfie" && checkInPreview
            ? "Image selected"
            : name === "check_out_selfie" && checkOutPreview
              ? "Image selected"
              : name === "bdm_client_feedback_form" && feedbackFormName
                ? feedbackFormName
                : name === "bdm_client_visit_report"
                  ? visitReportName
                  : "No file chosen"
                  
          } */}

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
                    : "No file chosen"
          }
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
                  Product Type :
                  {producttypelist.map((country, i) => {
                    return country.id == lead.product_type ? " " + country.label : ""
                  })}
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
            </div>
          </div>
          {/* Basic Information Section End */}

          {/* Additional Details */}
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
                          <label className="block text-sm font-medium text-gray-700">{row.contact_person_email}</label>
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
          {/* Addition Details Section End */}

          {/* Middle Man Details */}
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
                          <label className="block text-sm font-medium text-gray-700">{mrow.mcontact_person_name}</label>
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
          {/* Middle Man End */}

          {/* Architect Firm Details Section */}
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
          {/* Architect Firm Details Section End */}

          {/* MEP Firm Details Section */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">MEP Firm Details</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name : {lead.mep_client_name}</label>
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
          {/* MEP Firm Details Section End */}

          {/* PMC Firm Details Section */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">PMC Firm Details</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name : {lead.pmc_client_name}</label>
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
                  value={formData.need_of_field_visit_remarks || ""}
                  onChange={handleFieldVisitRemarksChange}
                ></textarea>
              </div>
            </div>
          ) : null}

          {activeTab == "assign-leads-to-bdm" ? (
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

              {/* Fields that only show if check-in selfie is uploaded */}
              {lead.check_in_selfie &&  (
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
                      >BDM Client Visit Report</a>
                    </div>
                  )}
                  {!lead.bdm_client_visit_report && (
                    <div className="mt-4">
                      <FileInput label="Upload Visit Report" accept="application/pdf" name="bdm_client_visit_report" onChange={handleChange} />
                      {visitReportName && (
                        <div className="mt-2">
                          <span>{visitReportName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proposal scope */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal scope
                    </label>       
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

                  {/* Proposal type */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Proposal Type:</label>
                    <select
                      name="proposal_type"
                      value={formData.proposal_type || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option>Select Proposal Type</option>
                      {producttypelist.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remarks */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Remarks:</label>
                    <textarea
                      name="bdm_visit_remarks"
                      value={formData.bdm_visit_remarks || ""}
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
                      >BDM Client Feedback Form</a>
                    </div>
                  )}
                  {!lead.bdm_client_feedback_form && (
                    <div className="mt-4">
                      <FileInput label="Upload Client Feedback Form" accept="application/pdf" name="bdm_client_feedback_form" onChange={handleChange} />
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

          {activeTab === "assigned-leads" || activeTab === "sse-inprogress-leads" ? (
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
                        >BDM Client Visit Report</a>
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
                        >BDM Client Feedback Form</a>
                      </div>
                    )}

                  

                  {lead.proposal_type && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Proposal Type:
                        {producttypelist.map((country, i) => {
                          return country.id == lead.proposal_type ? " " + country.label : ""
                        })}
                      </label>
                    </div>  
                    )}

                  {lead.proposal_scope && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Proposal Scope:
                        {typelist.map((country, i) => {
                          return country.id == lead.proposal_type ? " " + country.label : ""
                        })}
                      </label>
                    </div>  
                    )}

                  {lead.bdm_visit_remarks && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Remarks: {lead.bdm_visit_remarks}</label>
                    </div>
                  )}
                    
                </div>
              </div>
              ) : null}
              
              {lead.need_of_field_visit !== null ? (    
            <div className="space-y-4 rounded-lg bg-white border p-4">


              
              <h3 className="font-semibold text-lg border-b pb-2">Proposal Approval</h3>
             
              {/* Upload Proposal */}
              <div className="mt-4">
                {lead.salestl_proposal && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Client Proposal:</label>
                    <a
                        href={lead.salestl_proposal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >Client Proposal</a>
                  </div>
                )}
                {!lead.salestl_proposal && (
                  <>
                    <FileInput label="Upload Proposal" accept="application/pdf" name="salestl_proposal" onChange={handleChange} />
                    {proposalName && (
                      <div className="mt-2">
                        <span>{proposalName}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* Upload Proposal End */}

              {/* Approve Proposal */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Approve Proposal:</label>
                <select
                    name="salestl_approval_status"
                    //value={formData.need_of_field_visit || ""}
                    value={formData.salestl_approval_status !== null ? formData.salestl_approval_status : ""}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2" onChange={(e) => handleProposalApproval(e)}>
                    <option value={null}>Please select</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                </select>
              </div>
              {/* Approve Proposal End */}


              {/* Shared Status */}
              {lead.salestl_approval_status == '1' ? (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Shared Status:</label>
                <select
                    name="salestl_shared_status"
                    //value={formData.need_of_field_visit || ""}
                    value={formData.salestl_shared_status !== null ? formData.salestl_shared_status : ""}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2" onChange={(e) => handleSharedStatus(e)}>
                    <option value={null}>Please select</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                </select>
                </div>
              ) : null}
              {/* Shared Status End */}
                </div>
                ) : null}
            </>
          ) : null}

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
            (activeTab =="assigned-leads" && lead.need_of_field_visit !== null) ||
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

export default LeadEditForm

