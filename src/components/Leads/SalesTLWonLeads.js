"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"
import LeadEditForm from "./LeadEditForm"
import SalesTLHandOverForm from "./SalesTLHandOverForm"
import { FiEdit2, FiAlertCircle, FiCheck, FiDownload, FiChevronRight, FiFilter, FiSearch, FiBell } from "react-icons/fi"
import { TbTransferIn } from "react-icons/tb"

function SalesTLWonLeads() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unassignedleads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [handoverselectedLead, setHandOverSelectedLead] = useState(null)
  const [showHandOverForm, setShowHandOverForm] = useState(false)
  const { user } = useAuth()

  const [successMessage, setSuccessMessage] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [sourcelist, setSourcelist] = useState([])
  const [typelist, setTypelist] = useState([])
  const [producttypelist, setProductTypelist] = useState([])
  const [employeeList, setEmployeeList] = useState([])
  const [sseList, setSseList] = useState([])
  const [bdmList, setBdmList] = useState([])
  const [showHandoverButton, setShowHandoverButton] = useState([])

  // Enhanced filter states - separate current filters from applied filters
  const [filters, setFilters] = useState({
    leadCode: "",
    fromDate: "",
    toDate: "",
    assignedSse: "",
    assignedBdm: "",
    priority: "",
    leadType: "",
    leadSource: "",
  })

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

  // Export and UI states
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [expandedRows, setExpandedRows] = useState({})
  const leadsPerPage = 30

  var userId = ""
  if (user) {
    userId = user.userId
  }

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const page = currentPage - 1

      // Build query parameters properly
      const queryParams = new URLSearchParams()

      // Only add non-empty parameters
      if (appliedFilters.leadCode && appliedFilters.leadCode.trim() !== "") {
        queryParams.append("leadCode", appliedFilters.leadCode.trim())
      }

      if (appliedFilters.fromDate && appliedFilters.fromDate.trim() !== "") {
        queryParams.append("fromDate", appliedFilters.fromDate.trim())
      }

      if (appliedFilters.toDate && appliedFilters.toDate.trim() !== "") {
        queryParams.append("toDate", appliedFilters.toDate.trim())
      }

      if (appliedFilters.assignedSse && appliedFilters.assignedSse.trim() !== "") {
        queryParams.append("assignedSse", appliedFilters.assignedSse.trim())
      }

      if (appliedFilters.assignedBdm && appliedFilters.assignedBdm.trim() !== "") {
        queryParams.append("assignedBdm", appliedFilters.assignedBdm.trim())
      }

      if (appliedFilters.priority && appliedFilters.priority.trim() !== "") {
        queryParams.append("priority", appliedFilters.priority.trim())
      }

      if (appliedFilters.leadType && appliedFilters.leadType.trim() !== "") {
        queryParams.append("leadType", appliedFilters.leadType.trim())
      }

      if (appliedFilters.leadSource && appliedFilters.leadSource.trim() !== "") {
        queryParams.append("leadSource", appliedFilters.leadSource.trim())
      }

      console.log("Query parameters:", queryParams.toString())

      console.log("[v0] Fetching leads - page:", page, "leadsPerPage:", leadsPerPage)

      const data = await leadService.getSalesTlWonLeads(
        page,
        leadsPerPage,
        appliedFilters.leadCode || "",
        appliedFilters.fromDate || "",
        appliedFilters.toDate || "",
        appliedFilters.assignedSse || "",
        appliedFilters.assignedBdm || "",
        appliedFilters.priority || "",
        appliedFilters.leadType || "",
        appliedFilters.leadSource || "",
      )

      console.log("[v0] API Response received:", data)
      console.log("[v0] Results array:", data.results)
      console.log("[v0] Results length:", data.results?.length)
      console.log("[v0] First lead sample:", data.results?.[0])
      console.log("[v0] First lead uploaded documents:", data.results?.[0]?.lead_uploaded_documents)

      setLeads(data.results || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalResults || 0)
      setLoading(false)

      console.log("[v0] State updated - loading set to false, leads count:", data.results?.length || 0)
    } catch (error) {
      console.error("[v0] Error fetching leads:", error)
      console.error("[v0] Error details:", error.message, error.stack)
      setError("Failed to fetch leads")
      setLoading(false)
    }
  }, [currentPage, leadsPerPage, appliedFilters])

  useEffect(() => {
    fetchLeads()
    if (sourcelist.length === 0) {
      fetchSourceTypeData()
    }
  }, [fetchLeads, sourcelist.length])

  // Reset to first page when applied filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [appliedFilters])

  const fetchSourceTypeData = async () => {
    try {
      const [leadSource, leadType, leadProductType, sseData, bdmData] = await Promise.all([
        leadService.getLeadSourceList(),
        leadService.getLeadTypeList(),
        leadService.getLeadProductTypeList(),
        leadService.getSSEList(),
        leadService.getBDMList(),
      ])
      setSourcelist(leadSource)
      setTypelist(leadType)
      setProductTypelist(leadProductType)
      setSseList(sseData)
      setBdmList(bdmData)
    } catch (err) {
      setError("Error while fetching data")
      console.error(err)
    }
  }

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const [sseList, bdmList] = await Promise.all([leadService.getSSEList(), leadService.getBDMList()])
        setEmployeeList([...sseList, ...bdmList])
      } catch (err) {
        console.error("Error fetching employee data:", err)
        setError("Error while fetching employee data")
      }
    }

    //fetchEmployeeData()
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const applyFilters = () => {
    console.log("Applying filters:", filters)
    setAppliedFilters({ ...filters })
    setShowMobileFilters(false)

    // Debug log to verify filter values
    console.log("Applied filters:", {
      leadCode: filters.leadCode || "",
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      assignedSse: filters.assignedSse || "",
      assignedBdm: filters.assignedBdm || "",
      priority: filters.priority || "",
      leadType: filters.leadType || "",
      leadSource: filters.leadSource || "",
    })
  }

  const clearFilters = () => {
    const emptyFilters = {
      leadCode: "",
      fromDate: "",
      toDate: "",
      assignedSse: "",
      assignedBdm: "",
      priority: "",
      leadType: "",
      leadSource: "",
    }
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setCurrentPage(1)
    setShowMobileFilters(false)
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
      setSuccessMessage("Lead updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError("Failed to update lead")
    }
  }

  const handleEdit = (e, id) => {
    e.stopPropagation()
    const lead = unassignedleads.find((emp) => emp.id === id)
    setSelectedLead(lead)
    setShowForm(true)
  }

  const handleHandOverEdit = (e, id) => {
    e.stopPropagation()
    const lead = unassignedleads.find((emp) => emp.id === id)
    setHandOverSelectedLead(lead)
    setShowHandOverForm(true)
  }

  const handleExport = async (format) => {
    try {
      setIsExporting(true)
      setError(null)

      const queryParams = new URLSearchParams()
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== "") {
          queryParams.append(key, value.toString().trim())
        }
      })

      await leadService.exportSalesTLWonOrLostLeads(format, queryParams.toString())

      setSuccessMessage(`Leads exported successfully as ${format.toUpperCase()}`)
      setTimeout(() => setSuccessMessage(null), 3000)
      setShowExportOptions(false)
    } catch (error) {
      console.error("Export error:", error)
      setError("Failed to export leads: " + (error.message || "Unknown error"))
    } finally {
      setIsExporting(false)
    }
  }

  const Capitalize = (str) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

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

  const getLeadType = (leadTypeId) => {
    const type = typelist.find((type) => type.id === leadTypeId)
    return type ? type.label : ""
  }

  const getProductTypes = (productTypes) => {
    if (!productTypes) return ""
    return productTypes
      .map((type, itr) => {
        const ptlabel = matchingLabels(type, producttypelist).toString()
        return itr !== productTypes.length - 1 ? ptlabel + ", " : ptlabel.substring(0, ptlabel.length - 1)
      })
      .join("")
  }

  const getBDMStatus = (lead) => {
    if (lead.assigned_bdm !== null) {
      return {
        label: `${lead.assigned_bdm.firstName} ${lead.assigned_bdm.lastName}`,
        className: "",
      }
    } else {
      return {
        label: "N/A",
        className: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20",
      }
    }
  }

  const getSSEStatus = (lead) => {
    if (lead.assigned_bdm !== null) {
      return {
        label: `${lead.assigned_sse.firstName} ${lead.assigned_sse.lastName}`,
        className: "",
      }
    } else {
      return {
        label: "N/A",
        className: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20",
      }
    }
  }

  const getPOStatus = (lead) => {
    console.log("[v0] Getting PO status for lead:", lead.id, lead.lead_code)
    console.log("[v0] Lead documents:", lead.leadDocuments)

    const uploadedDocuments =
      lead.leadDocuments || lead.lead_uploaded_documents || lead.uploadedDocuments || lead.documents || []

    console.log("[v0] Uploaded documents found:", uploadedDocuments.length)
    console.log("[v0] All documents:", uploadedDocuments)

    const poDocuments = uploadedDocuments.filter((doc) => doc.document_type === "po_document")

    console.log("[v0] PO documents found:", poDocuments.length)

    // Sort by uploadedAt in descending order (latest first) and get the first one
    const latestPoDocument =
      poDocuments.length > 0 ? poDocuments.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0] : null

    console.log("[v0] Latest PO document:", latestPoDocument)

    // If no PO document found
    if (!latestPoDocument || !latestPoDocument.status) {
      console.log("[v0] No PO document or status found")
      return {
        label: "No PO",
        className: "bg-gray-50 text-gray-600 ring-1 ring-gray-300/20",
        showNotification: false,
      }
    }

    // Get the status from the latest PO document
    const poStatus = latestPoDocument.status
    console.log("[v0] Latest PO Status:", poStatus)

    if (poStatus === "Revision from Sales") {
      return {
        label: "Revision from Sales",
        className: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 font-semibold",
        showNotification: true,
      }
    } else if (poStatus === "Approve") {
      return {
        label: "Approved",
        className: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
        showNotification: false,
      }
    } else if (poStatus === "In progress") {
      return {
        label: "In Progress",
        className: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
        showNotification: false,
      }
    } else {
      return {
        label: poStatus || "N/A",
        className: "bg-gray-50 text-gray-600 ring-1 ring-gray-300/20",
        showNotification: false,
      }
    }
  }

  const checkHandOverButton = (lead) => {
    if (lead.leadStatus === "won") {
      //setShowHandoverButton(true)
      return true
    } else {
      //setShowHandoverButton(false)
      return false
    }
  }

  const getLeadStatus = (lead) => {
    if (lead.lead_status === "won") {
      return {
        label: "Won",
        className: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
      }
    } else if (lead.lead_status === "lost") {
      return {
        label: "Lost",
        className: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
      }
    } else {
      return {
        label: lead.lead_status !== "new" ? Capitalize(lead.lead_status) : "",
        className: "",
      }
    }
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

      {/* Lead List */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mx-2 md:mx-0">
        {/* Mobile Header with Filter Toggle */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Won/Lost Leads</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium"
            >
              <FiFilter className="w-4 h-4" />
              Filters
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                disabled={isExporting}
              >
                <FiDownload className="w-4 h-4" />
                {isExporting ? "..." : "Export"}
              </button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport("csv")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      disabled={isExporting}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport("excel")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      disabled={isExporting}
                    >
                      Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Won/Lost Leads</h2>
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              disabled={isExporting}
            >
              <FiDownload className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export"}
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => handleExport("csv")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    disabled={isExporting}
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    disabled={isExporting}
                  >
                    Export as Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden mb-4 flex flex-col gap-3 pb-3 border-b border-gray-200"
          >
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Lead Code</label>
              <input
                type="text"
                value={filters.leadCode}
                onChange={(e) => handleFilterChange("leadCode", e.target.value)}
                placeholder="Search by lead code..."
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">From Date</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                  className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">To Date</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                  className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Assigned SSE</label>
              <select
                value={filters.assignedSse}
                onChange={(e) => handleFilterChange("assignedSse", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All SSEs</option>
                {sseList.map((sse) => (
                  <option key={sse.id} value={sse.id}>
                    {sse.firstName} {sse.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Assigned BDM</label>
              <select
                value={filters.assignedBdm}
                onChange={(e) => handleFilterChange("assignedBdm", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All BDMs</option>
                {bdmList.map((bdm) => (
                  <option key={bdm.id} value={bdm.id}>
                    {bdm.firstName} {bdm.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Priorities</option>
                <option value="cold">Cold</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Lead Type</label>
              <select
                value={filters.leadType}
                onChange={(e) => handleFilterChange("leadType", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Types</option>
                {typelist.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-700 mb-1 block">Source</label>
              <select
                value={filters.leadSource}
                onChange={(e) => handleFilterChange("leadSource", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Sources</option>
                {sourcelist.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={applyFilters}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <FiSearch className="w-4 h-4" />
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}

        {/* Desktop Filters */}
        <div className="hidden md:block mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Lead Code</label>
              <input
                type="text"
                value={filters.leadCode}
                onChange={(e) => handleFilterChange("leadCode", e.target.value)}
                placeholder="Search by lead code..."
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Assigned SSE</label>
              <select
                value={filters.assignedSse}
                onChange={(e) => handleFilterChange("assignedSse", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All SSEs</option>
                {sseList.map((sse) => (
                  <option key={sse.id} value={sse.id}>
                    {sse.firstName} {sse.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Assigned BDM</label>
              <select
                value={filters.assignedBdm}
                onChange={(e) => handleFilterChange("assignedBdm", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All BDMs</option>
                {bdmList.map((bdm) => (
                  <option key={bdm.id} value={bdm.id}>
                    {bdm.firstName} {bdm.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Priorities</option>
                <option value="cold">Cold</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Lead Type</label>
              <select
                value={filters.leadType}
                onChange={(e) => handleFilterChange("leadType", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Types</option>
                {typelist.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-700 mb-1 block">Source</label>
              <select
                value={filters.leadSource}
                onChange={(e) => handleFilterChange("leadSource", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Sources</option>
                {sourcelist.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <FiSearch className="w-4 h-4" />
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
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
                    {[
                      "Lead ID",
                      "Lead Priority",
                      "Middle Man Client Name",
                      "Product Type",
                      "Asssigned SSE",
                      "Assigned BDM",
                      "PO Status", // Added PO Status column header
                      "Status",
                      "Action",
                    ]
                      .filter(Boolean)
                      .map((header) => (
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
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500 font-medium">
                        No leads found
                      </td>
                    </tr>
                  ) : (
                    unassignedleads.map((lead) => {
                      const bdmStatus = getBDMStatus(lead)
                      const leadStatus = getLeadStatus(lead)
                      const sseStatus = getSSEStatus(lead)
                      const poStatus = getPOStatus(lead) // Get PO status

                      return (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-gray-50 cursor-pointer transition-colors group"
                          onClick={() => handleRowClick(lead)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {<span>{lead.lead_code}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                  lead.lead_priority === "cold"
                                    ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                    : lead.lead_priority === "hot"
                                      ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                      : "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20"
                                }`}
                              >
                                {Capitalize(lead.lead_priority)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">
                              {lead.middle_man_client_name === "" ? lead.client_name : lead.middle_man_client_name}
                            </div>
                          </td>
                          {/* <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">{getLeadType(lead.lead_type)}</div>
                          </td> */}
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">
                              {getProductTypes(lead.lead_product_type)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">
                              {sseStatus.className ? (
                                <span
                                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${sseStatus.className}`}
                                >
                                  {sseStatus.label}
                                </span>
                              ) : (
                                sseStatus.label
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">
                              {bdmStatus.className ? (
                                <span
                                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${bdmStatus.className}`}
                                >
                                  {bdmStatus.label}
                                </span>
                              ) : (
                                bdmStatus.label
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">
                              <span
                                className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${poStatus.className}`}
                              >
                                {poStatus.showNotification && <FiBell className="w-3.5 h-3.5 animate-pulse" />}
                                {poStatus.label}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">
                              {leadStatus.className && (
                                <span
                                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${leadStatus.className}`}
                                >
                                  {leadStatus.label}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <button
                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                onClick={(e) => handleEdit(e, lead.id)}
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </button>

                              {lead.lead_status === "won" ? (
                                <button
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                  onClick={(e) => handleHandOverEdit(e, lead.id)}
                                  title="HandOver to Project/AMC"
                                >
                                  <TbTransferIn size={18} />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {unassignedleads.length === 0 ? (
                <div className="p-4 text-center text-gray-500 font-medium">No leads found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {unassignedleads.map((lead) => {
                    const bdmStatus = getBDMStatus(lead)
                    const leadStatus = getLeadStatus(lead)
                    const sseStatus = getSSEStatus(lead)
                    const poStatus = getPOStatus(lead) // Get PO status for mobile view

                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(lead)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-gray-900">{lead.lead_code}</div>
                          <button
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                            onClick={(e) => handleEdit(e, lead.id)}
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                          <div className="text-gray-500">Priority:</div>
                          <div>
                            <span
                              className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                lead.lead_priority === "cold"
                                  ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                  : lead.lead_priority === "hot"
                                    ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                    : "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20"
                              }`}
                            >
                              {Capitalize(lead.lead_priority)}
                            </span>
                          </div>

                          <div className="text-gray-500">Client:</div>
                          <div className="font-medium">
                            {lead.middle_man_client_name === "" ? lead.client_name : lead.middle_man_client_name}
                          </div>

                          <div className="text-gray-500">PO Status:</div>
                          <div>
                            <span
                              className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full ${poStatus.className}`}
                            >
                              {poStatus.showNotification && <FiBell className="w-3 h-3 animate-pulse" />}
                              {poStatus.label}
                            </span>
                          </div>

                          <div className="text-gray-500">Status:</div>
                          <div>
                            {leadStatus.className && (
                              <span
                                className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${leadStatus.className}`}
                              >
                                {leadStatus.label}
                              </span>
                            )}
                          </div>

                          <div className="text-gray-500">SSE:</div>
                          <div>
                            {sseStatus.className ? (
                              <span
                                className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${sseStatus.className}`}
                              >
                                {sseStatus.label}
                              </span>
                            ) : (
                              sseStatus.label
                            )}
                          </div>

                          <div className="text-gray-500">BDM:</div>
                          <div>
                            {bdmStatus.className ? (
                              <span
                                className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${bdmStatus.className}`}
                              >
                                {bdmStatus.label}
                              </span>
                            ) : (
                              bdmStatus.label
                            )}
                          </div>

                          {/* Expandable content */}
                          {expandedRows[lead.id] && (
                            <>
                              <div className="text-gray-500">Type:</div>
                              <div>{getLeadType(lead.lead_type)}</div>

                              <div className="text-gray-500">Product Type:</div>
                              <div className="break-words">{getProductTypes(lead.lead_product_type)}</div>
                            </>
                          )}
                        </div>

                        {/* Expand/collapse indicator */}
                        <div className="flex justify-center mt-2">
                          <FiChevronRight
                            className={`text-gray-400 transition-transform ${expandedRows[lead.id] ? "rotate-90" : ""}`}
                            size={16}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
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
          {Math.min(currentPage * leadsPerPage, totalResults)} of {totalResults} leads
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <LeadEditForm
            lead={selectedLead}
            activeTab="salestl-won-leads"
            onClose={() => {
              setShowForm(false)
              setSelectedLead(null)
            }}
            onSubmit={handleAddEmployee}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHandOverForm && (
          <SalesTLHandOverForm
            lead={handoverselectedLead}
            activeTab="salestl-won-leads"
            onClose={() => {
              setShowHandOverForm(false)
              setHandOverSelectedLead(null)
            }}
            onSubmit={handleAddEmployee}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SalesTLWonLeads