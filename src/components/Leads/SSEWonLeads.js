"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"
import LeadEditForm from "./LeadEditForm"
import { FiEdit2, FiAlertCircle, FiX, FiCheck, FiFilter, FiDownload, FiSearch } from "react-icons/fi"

function SSEWonLeads() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unassignedleads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showTerminationForm, setShowTerminationForm] = useState(false)
  const { user } = useAuth()

  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [sourcelist, setSourcelist] = useState([])
  const [typelist, setTypelist] = useState([])
  const [producttypelist, setProductTypelist] = useState([])

  const [bdmList, setBdmList] = useState([])

  // Filter states - separate from applied filters
  const [filters, setFilters] = useState({
    leadCode: "",
    fromDate: "",
    toDate: "",
    assignedBdm: "",
    priority: "",
    leadType: "",
    leadSource: "",
  })

  // Applied filters state (what's actually sent to API)
  const [appliedFilters, setAppliedFilters] = useState({
    leadCode: "",
    fromDate: "",
    toDate: "",
    assignedBdm: "",
    priority: "",
    leadType: "",
    leadSource: "",
  })

  // Export states
  const [isExporting, setIsExporting] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)

  // Mobile filter state
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const leadsPerPage = 30

  var userId = ""

  if (user) {
    userId = user.userId
  }

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Convert to 0-based index for the API
      const page = currentPage - 1

      // Updated API call to use the enhanced getSSEWonLeads method with all filters
      const data = await leadService.getSSEWonLeads(
        userId,
        page,
        leadsPerPage,
        appliedFilters.priority,
        appliedFilters.fromDate,
        appliedFilters.toDate,
        appliedFilters.assignedBdm,
        appliedFilters.leadCode,
        appliedFilters.leadType,
        appliedFilters.leadSource,
      )

      setLeads(data.results || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalResults || 0)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch leads")
      setLoading(false)
    }
  }, [currentPage, leadsPerPage, appliedFilters, userId])

  useEffect(() => {
    fetchLeads()
    if (sourcelist.length === 0) {
      fetchSourceTypeData()
    }
  }, [fetchLeads, sourcelist.length])

  const fetchSourceTypeData = async () => {
    try {
      const [leadSource, leadType, leadProductType, bdmData] = await Promise.all([
        leadService.getLeadSourceList(),
        leadService.getLeadTypeList(),
        leadService.getLeadProductTypeList(),
        leadService.getBDMList(),
      ])
      setSourcelist(leadSource)
      setTypelist(leadType)
      setProductTypelist(leadProductType)
      setBdmList(bdmData)
    } catch (err) {
      setError("Error while fetching data")
      console.error(err)
    }
  }

  // Reset to first page when applied filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [appliedFilters])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    // Scroll to top on mobile when changing pages
    if (window.innerWidth < 768) {
      window.scrollTo(0, 0)
    }
  }

  const handleRowClick = (lead) => {
    console.log("Row clicked")
    //navigate(`/onboarding/employee/${encryptId(employee.id)}`)
  }

  const handleAddEmployee = async () => {
    try {
      await fetchLeads()
      setShowForm(false)
      setSelectedLead(null)
    } catch (error) {
      setError("Failed to add employee")
    }
  }

  const handleEdit = (e, id) => {
    e.stopPropagation()
    const lead = unassignedleads.find((emp) => emp.id === id)
    console.log("Handle Edit")
    console.log(lead)
    setSelectedLead(lead)
    setShowForm(true)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  const applyFilters = () => {
    setAppliedFilters({ ...filters })
    setShowMobileFilters(false)
  }

  const clearFilters = () => {
    const emptyFilters = {
      leadCode: "",
      fromDate: "",
      toDate: "",
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

  const handleExport = async (format) => {
    try {
      setIsExporting(true)
      setError(null)

      await leadService.exportSSEWonLeads(
        format,
        userId,
        appliedFilters.leadCode,
        appliedFilters.fromDate,
        appliedFilters.toDate,
        appliedFilters.assignedBdm,
        appliedFilters.priority,
        appliedFilters.leadType,
        appliedFilters.leadSource,
      )

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

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mx-2 md:mx-0">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Won Leads</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium"
            >
              <FiFilter className="w-4 h-4" />
              Filters
            </button>
            {/* <button
              onClick={() => setShowExportOptions(true)}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button> */}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Won Leads</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Search Lead ID..."
                value={filters.leadCode}
                onChange={(e) => handleFilterChange("leadCode", e.target.value)}
                className="text-sm pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            {/* <button
              onClick={() => setShowExportOptions(true)}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <FiDownload className="w-5 h-5" />
              Export
            </button> */}
          </div>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex mb-6 min-w-full flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Lead Received </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Priority </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              name="lead_priority"
              className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Priorities</option>
              <option value="cold">Cold</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Lead Type </label>
            <select
              value={filters.leadType}
              onChange={(e) => handleFilterChange("leadType", e.target.value)}
              name="lead_type"
              className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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
            <label className="text-xs text-gray-700 mb-1 block">Source </label>
            <select
              value={filters.leadSource}
              onChange={(e) => handleFilterChange("leadSource", e.target.value)}
              name="lead_source"
              className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Sources</option>
              {sourcelist.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-700 mb-1 block">Assigned BDM</label>
            <select
              value={filters.assignedBdm}
              onChange={(e) => handleFilterChange("assignedBdm", e.target.value)}
              name="assigned_bdm"
              className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All BDMs</option>
              {bdmList.map((bdm) => (
                <option key={bdm.id} value={bdm.id}>
                  {bdm.firstName} {bdm.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="self-end">
            <button
              onClick={applyFilters}
              className="text-xs px-3 pl-3 pr-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="text-xs px-3 pl-3 pr-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
            >
              Clear Filters
            </button>
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
              <label className="text-xs font-medium text-gray-700 mb-1 block">Lead ID</label>
              <input
                type="search"
                placeholder="Search Lead ID..."
                value={filters.leadCode}
                onChange={(e) => handleFilterChange("leadCode", e.target.value)}
                className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Lead Received</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                  className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                  className="w-full text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                name="lead_priority"
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
                name="lead_type"
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
                name="lead_source"
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

            <div>
              <label className="text-xs text-gray-700 mb-1 block">Assigned BDM</label>
              <select
                value={filters.assignedBdm}
                onChange={(e) => handleFilterChange("assignedBdm", e.target.value)}
                name="assigned_bdm"
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

            <div className="flex justify-end">
              <button
                onClick={applyFilters}
                className="text-xs px-3 pl-3 pr-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="text-xs px-3 pl-3 pr-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}

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
                      "Lead Type",
                      "Product Type",
                      "Assigned BDM",
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
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500 font-medium">
                        No leads found
                      </td>
                    </tr>
                  ) : (
                    unassignedleads.map((lead) => (
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
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-900">
                            {typelist.map((country, i) => {
                              return country.id == lead.lead_type ? " " + country.label : ""
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-900">
                            {lead.lead_product_type !== null
                              ? lead.lead_product_type.map((country, itr) => {
                                  const ptlabel = matchingLabels(country, producttypelist).toString()
                                  return itr !== lead.lead_product_type.length - 1
                                    ? ptlabel + ",  "
                                    : ptlabel.substring(0, ptlabel.length - 1)
                                })
                              : ""}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-900">
                            {lead.assigned_bdm !== null ? (
                              lead.assigned_bdm.firstName + "  " + lead.assigned_bdm.lastName
                            ) : (
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20`}
                              >
                                N/A
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-900">
                            <span
                              className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                lead.lead_status === "won"
                                  ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                  : lead.lead_priority === "hot"
                                    ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                    : ""
                              }`}
                            >
                              {lead.lead_status !== "new" ? Capitalize(lead.lead_status) : ""}
                            </span>
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
                          </div>
                        </td>
                      </motion.tr>
                    ))
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
                  {unassignedleads.map((lead) => (
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

                        <div className="text-gray-500">Type:</div>
                        <div>
                          {typelist.map((country, i) => {
                            return country.id == lead.lead_type ? country.label : ""
                          })}
                        </div>

                        <div className="text-gray-500">BDM:</div>
                        <div>
                          {lead.assigned_bdm !== null ? (
                            lead.assigned_bdm.firstName + " " + lead.assigned_bdm.lastName
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20">
                              N/A
                            </span>
                          )}
                        </div>

                        <div className="text-gray-500">Status:</div>
                        <div>
                          {lead.lead_status !== "new" && (
                            <span
                              className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                lead.lead_status === "won"
                                  ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                  : lead.lead_priority === "hot"
                                    ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                    : ""
                              }`}
                            >
                              {Capitalize(lead.lead_status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
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

      {showMigrateDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowMigrateDialog(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-[600px] mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMigrateDialog(false)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </motion.div>
        </motion.div>
      )}

      {showExportOptions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowExportOptions(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-[400px] mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Options</h3>
            <p className="text-sm text-gray-600 mb-4">Choose the format to export leads:</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleExport("csv")}
                disabled={isExporting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport("excel")}
                disabled={isExporting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export as Excel
              </button>
            </div>
            <button
              onClick={() => setShowExportOptions(false)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </motion.div>
        </motion.div>
      )}

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
    </div>
  )
}

export default SSEWonLeads