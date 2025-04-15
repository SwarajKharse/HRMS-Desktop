"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { leadService } from "../../services/leadService"
import { useAuth } from "../../contexts/AuthContext"
import LeadEditForm from "./LeadEditForm"
import { FiEdit2, FiAlertCircle, FiX, FiCheck } from "react-icons/fi"

function BDMAssignedFieldVisit() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unassignedleads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateSearchQuery, setDateSearchQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showTerminationForm, setShowTerminationForm] = useState(false)
  const { user } = useAuth()
  var userId = "";

  if (user) {
    userId = user.userId
  }

  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [sourcelist, setSourcelist] = useState([])
  const [typelist, setTypelist] = useState([])
  const [producttypelist, setProductTypelist] = useState([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 20

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      let data = []
      data = await leadService.getLeadsAssignesToBDM(userId)
      console.log(data)
      var newBookArr = [].concat(data.results)
      setLeads(newBookArr)
      setFilteredLeads(newBookArr)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch leads 1111111")
      setLoading(false)
    }
  }, [user?.orgId])

  useEffect(() => {
    fetchLeads()
    fetchSourceTypeData()
  }, [fetchLeads])

  useEffect(() => {
    const filterLeads = () => {
      let filtered = [...unassignedleads]

      // Filter by lead priority
      if (searchQuery !== "") {
        filtered = filtered.filter((lead) => lead.lead_priority === searchQuery)
      }

      // Filter by date received
      if (dateSearchQuery !== "") {
        filtered = filtered.filter((lead) => lead.lead_recieved === dateSearchQuery)
      }

      setFilteredLeads(filtered)
      setCurrentPage(1) // reset to first page on search change
    }

    filterLeads()
  }, [searchQuery, dateSearchQuery, unassignedleads])

  const fetchSourceTypeData = async () => {
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
      setError("Error while fetching data")
      console.error(err)
    } finally {
    }
  }

  // Calculate pagination variables
  const indexOfLastLead = currentPage * leadsPerPage
  const indexOfFirstLead = indexOfLastLead - leadsPerPage
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead)
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
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

  const Capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const fetchDateFromApi = (apiDate) => {
    
      // Adjust this according to your actual API response format
      //const apiDate = new Date(data.date)
      // Get today's date (with time set to 00:00:00)
      /* const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get the API date with time set to 00:00:00 for comparison
      const apiDateOnly = new Date(apiDate)
      apiDateOnly.setHours(0, 0, 0, 0)

      return apiDateOnly.getTime() === today.getTime() */
      // Create date from input value
      var inputDate = new Date(apiDate);


      var todaysDate = new Date();


    if (inputDate.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
      return true;
    }
    return false;
  }



  if (loading) {
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
    <div className="flex flex-col gap-8">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100"
        >
          <FiAlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 flex items-center shadow-sm"
        >
          <FiCheck className="w-5 h-5 mr-2" />
          <span className="font-medium">{successMessage}</span>
        </motion.div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative mb-6 min-w-full">
          <label className="text-sm font-medium text-gray-700 mb-2">Lead Recieved </label>
          <input
            type="date"
            value={dateSearchQuery}
            onChange={(e) => setDateSearchQuery(e.target.value)}
            data-date-format="YYYY-MM-DD"
            className="pl-6 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
          <label className="pl-12 text-sm font-medium text-gray-700 mb-2">Lead Priority </label>
          <select
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            name="lead_priority"
            className="mt-1 rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select Type</option>
            <option value="cold">Cold</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
          </select>
          <button
            onClick={() => {
              setSearchQuery("")
              setDateSearchQuery("")
            }}
            className="ml-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Lead ID", "Lead Priority", "Middle Man Client Name", "Lead Type", "Visit Scheduled Date", "Actions"]
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
                  {currentLeads.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-center text-gray-500 font-medium">No leads found</td>
                    </tr>
                  ) : (
                    currentLeads.map((lead) => (
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
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors"></div>
                              {/* <div className="text-sm text-gray-500">{employee.employeeCode}</div> */}
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
                          <div className="text-xs font-medium text-gray-900">{lead.middle_man_client_name}</div>
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
                            {/* {producttypelist.map((country, i) => {
                              return country.id == lead.product_type ? " " + country.label : ""
                            })} */}
                            {lead.visit_scheduled_date}<span className="px-1"></span>
                            {fetchDateFromApi(lead.visit_scheduled_date) ?
                              <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-50 text-green-700 ring-1 ring-green-600/20">Today</span>
                              : ""}
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

                            {/* <button
                                    className="text-gray-400 hover:text-yellow-600 transition-colors"
                                    onClick={(e) => handleIssueWarning(e, lead)}
                                    title="Issue Warning"
                                  >
                                    <FiAlertTriangle size={18} />
                                  </button>
                                  <button
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    onClick={(e) => handleTerminate(e, lead)}
                                    title="Terminate"
                                  >
                                    <FiUserX size={18} />
                                  </button> */}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md border text-sm ${
                  currentPage === page ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
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
            className="bg-white rounded-xl shadow-xl p-6 w-[600px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMigrateDialog(false)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Migrate Employee Data</h2>
              <p className="text-sm text-gray-500 mt-1">Export your current data or import new data</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <LeadEditForm
            lead={selectedLead}
            activeTab="bdm-assigned-field-visit"
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

export default BDMAssignedFieldVisit

