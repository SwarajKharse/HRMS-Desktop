"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { FiX, FiUpload, FiAlertCircle, FiCheck } from "react-icons/fi"
import { authService } from "../../services/authService"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"
import { projectService } from "../../services/projectService"
import ProductBOQSelector from "../Projects/ProductBOQSelector"

const SalesTLHandOverForm = ({ lead, activeTab, onClose, onSubmit }) => {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const modalRef = useRef(null)

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
  const [poUploadedDocuments, setPoUploadedDocuments] = useState([])
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
  const [currentProductCount, setCurrentProductCount] = useState(0)

  const [gstType, setGstType] = useState("CGST_SGST")
  const [cgstPercent, setCgstPercent] = useState(9)
  const [sgstPercent, setSgstPercent] = useState(9)
  const [igstPercent, setIgstPercent] = useState(18)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const preGstAmount = (boqData?.items || []).reduce((sum, product) => sum + (product.total || 0), 0)
  let gstAmount = 0
  let postGstAmount = 0
  let cgstAmount = 0
  let sgstAmount = 0
  let igstAmount = 0

  useEffect(() => {
    function handleClickOutsideModal(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutsideModal)
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideModal)
    }
  }, [onClose])

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
    setFormData({
      ...formData,
      [name]: value,
    })
    if (error) {
      console.log(error)
    }
  }

  const handleBOQSave = (boqDataFromSelector, wasSavedToBackend = false) => {
    console.log("[v0] handleBOQSave - BOQ data received:", boqDataFromSelector)
    setBOQData(boqDataFromSelector)
    setShowBOQSelector(false)
    if (wasSavedToBackend) {
      setSuccessMessage("BOQ saved successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      // Removed checkExistingProject() call to prevent overwriting with database values
      // The boqData state already has the correct values from the selector
    }
  }

  const handleProductCountChange = useCallback(
    (count, productsData) => {
      console.log("[v0] SalesTLHandOverForm - received product count update:", count)
      console.log("[v0] SalesTLHandOverForm - raw products data:", productsData)

      setCurrentProductCount(count)

      if (count > 0) {
        const allProducts = Object.values(productsData).flat()

        const transformedItems = allProducts.map((p) => {
          console.log("[v0] Original product data:", {
            productId: p.productId,
            qty: p.qty,
            qtyType: typeof p.qty,
            supplyRate: p.supplyRate,
            supplyRateType: typeof p.supplyRate,
            installationRate: p.installationRate,
            installationRateType: typeof p.installationRate,
          })

          const transformedItem = {
            productId: Number.parseInt(p.productId),
            product: p.product || {
              id: p.productId,
              productName: p.productName,
              hsnCode: p.hsnCode,
              uom: p.uom,
            },
            qty: Number.parseFloat(p.qty) || 0,
            totalQty: Number.parseFloat(p.qty) || 0,
            make: p.make || "",
            uom: p.uom || "",
            leadProductTypeId: Number.parseInt(p.leadProductTypeId),
            supplyRate: Number.parseFloat(p.supplyRate) || 0,
            installationRate: Number.parseFloat(p.installationRate) || 0,
            supplyAmount: Number.parseFloat(p.supplyAmount) || 0,
            installationAmount: Number.parseFloat(p.installationAmount) || 0,
            total: Number.parseFloat(p.total) || 0,
          }

          console.log("[v0] Transformed item:", transformedItem)
          return transformedItem
        })

        const newBOQData = {
          projectId: existingProject ? existingProject.projectId : lead.id,
          items: transformedItems,
        }

        console.log("[v0] Final BOQ data being set:", JSON.stringify(newBOQData, null, 2))
        setBOQData(newBOQData)
      } else {
        setBOQData(null)
      }
    },
    [existingProject, lead.id],
  )
  // End of handleProductCountChange update

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

      const payloadForBackend = {
        ...(existingProject
          ? {
              id: existingProject.projectId,
              project_name: existingProject.projectName,
              project_status: existingProject.projectStatus,
              handover_from_sales: existingProject.handoverFromSales,
              date_of_handover_from_sales: existingProject.dateOfHandoverFromSales,
              date_of_into_call_by_se: existingProject.dateOfIntoCallBySe,
              date_of_kick_of_meeting: existingProject.dateOfKickOfMeeting,
              project_initiation_meet_date: existingProject.projectInitiationMeetDate,
              projectInitiationDate: existingProject.projectInitiationDate,
              numberOfWeeks: existingProject.numberOfWeeks,
              execution_team: existingProject.executionTeam,
              handover_file_status: existingProject.handover_file_status,
              form_a_noc_status: existingProject.form_a_noc_status,
              approval_from_fm: existingProject.approval_from_fm,
              payment_approval_date_by_fm: existingProject.payment_approval_date_by_fm,
              project_completion_eta: existingProject.project_completion_eta,
              project_completion_date: existingProject.project_completion_date,
              approval_from_pm: existingProject.approvalFromPm,
              sales_tl: existingProject.salesTl ? { id: existingProject.salesTl.id } : null,
              project_manager: existingProject.projectManager ? { id: existingProject.projectManager.id } : null,
              site_engineer: existingProject.siteEngineer ? { id: existingProject.siteEngineer.id } : null,
            }
          : {}),

        amc_or_project: formData.amc_or_project,
        project_name: finalProjectName,
        employee_updatedby: {
          id: userId,
        },
        ...(formData.amc_or_project === "project" && {
          gstType: gstType,
          cgstPercent: gstType === "CGST_SGST" ? cgstPercent : null,
          sgstPercent: gstType === "CGST_SGST" ? sgstPercent : null,
          igstPercent: gstType === "IGST" ? igstPercent : null,
          gstAmount: gstAmount,
          totalAmountWithGst: postGstAmount,
        }),
      }

      const projectResponse = await projectService.createOrUpdateProject(
        payloadForBackend,
        formData.amc_or_project,
        lead.id,
      )

      if (formData.amc_or_project === "project" && boqData && projectResponse && projectResponse.projectId) {
        try {
          // Final validation and parsing of BOQ data before sending to backend
          const validatedBOQData = {
            projectId: projectResponse.projectId,
            items: boqData.items.map((item) => {
              const validatedItem = {
                productId: Number.parseInt(item.productId),
                qty: Number.parseFloat(item.qty) || 0,
                make: item.make || "",
                uom: item.uom || "",
                leadProductTypeId: Number.parseInt(item.leadProductTypeId),
                supplyRate: Number.parseFloat(item.supplyRate) || 0,
                installationRate: Number.parseFloat(item.installationRate) || 0,
                supplyAmount: Number.parseFloat(item.supplyAmount) || 0,
                installationAmount: Number.parseFloat(item.installationAmount) || 0,
                total: Number.parseFloat(item.total) || 0,
              }

              console.log("[v0] Final validated BOQ item before sending to backend:", validatedItem)
              return validatedItem
            }),
          }

          console.log("[v0] Final validated BOQ data being sent to backend:", JSON.stringify(validatedBOQData, null, 2))

          await projectService.createOrUpdateBOQ(projectResponse.projectId, validatedBOQData)
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

  const getTotalProductCount = () => {
    return currentProductCount
  }

  const allProductsFlat = Array.isArray(boqData?.items) ? boqData.items : Object.values(boqData?.items || {}).flat()

  const totalSupplyAmount = allProductsFlat.reduce((sum, product) => sum + (product.supplyAmount || 0), 0)
  const totalInstallationAmount = allProductsFlat.reduce((sum, product) => sum + (product.installationAmount || 0), 0)
  const grandTotal = allProductsFlat.reduce((sum, product) => sum + (product.total || 0), 0)

  if (gstType === "CGST_SGST") {
    cgstAmount = preGstAmount * (cgstPercent / 100)
    sgstAmount = preGstAmount * (sgstPercent / 100)
    gstAmount = cgstAmount + sgstAmount
  } else {
    igstAmount = preGstAmount * (igstPercent / 100)
    gstAmount = igstAmount
  }
  postGstAmount = preGstAmount + gstAmount

  const handleGeneratePOPDF = async () => {
    if (!boqData || getTotalProductCount() === 0) {
      setError("Please create a BOQ before generating PO PDF")
      window.scrollTo(0, 0)
      return
    }

    try {
      setIsGeneratingPDF(true)
      setError("")

      const boqWithGST = {
        ...boqData,
        gstType,
        cgstPercent,
        sgstPercent,
        igstPercent,
        preGstAmount,
        gstAmount,
        postGstAmount,
      }

      const response = await projectService.generatePOPDF(lead.id, boqWithGST)

      if (response && response.pdfUrl) {
        setSuccessMessage("PO PDF generated successfully!")
        setTimeout(() => setSuccessMessage(null), 5000)
        window.open(response.pdfUrl, "_blank")
        fetchUploadedPOs()
      }
    } catch (error) {
      console.error("Error generating PO PDF:", error)

      if (error.response?.status === 403) {
        setError("You don't have permission to generate PO PDF. Please contact your administrator.")
      } else if (error.response?.status === 404) {
        setError("PO PDF generation endpoint not found. Please contact support.")
      } else {
        setError(`Failed to generate PO PDF: ${error.message || "Unknown error"}`)
      }

      window.scrollTo(0, 0)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      ref={modalRef}
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
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <FiX />
            </button>
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
            <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-400 hover:text-green-600">
              <FiX />
            </button>
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
          {formData.amc_or_project === "project" && (
            <>
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

                {showBOQSelector && (
                  <ProductBOQSelector
                    projectId={existingProject ? existingProject.projectId : lead.id}
                    onSave={handleBOQSave}
                    leadProductTypes={producttypelist}
                    existingBOQ={existingBOQData}
                    isEditMode={existingProject && existingProject.hasExistingBOQ}
                    currentUserId={userId}
                    projectSalesTlId={lead.employee_assigned_to_sales_tl?.id}
                    onBOQItemStatusUpdateSuccess={checkExistingProject}
                    onProductCountChange={handleProductCountChange}
                    gstType={gstType}
                    setGstType={setGstType}
                    cgstPercent={cgstPercent}
                    setCgstPercent={setCgstPercent}
                    sgstPercent={sgstPercent}
                    setSgstPercent={setSgstPercent}
                    igstPercent={igstPercent}
                    setIgstPercent={setIgstPercent}
                  />
                )}
              </div>
            </>
          )}

          {getTotalProductCount() > 0 ? (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-lg mb-3">Overall BOQ Totals</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-purple-700 text-md">
                    Total Supply Amount: ₹{totalSupplyAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-amber-600 text-md">
                    Total Installation Amount: ₹{totalInstallationAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-700 text-lg">Grand Total: ₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* ... existing GST configuration code ... */}
            </div>
          ) : (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                GST configuration and PO PDF generation will be available once you add products to the BOQ.
              </p>
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