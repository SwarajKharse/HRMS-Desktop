import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  FiPlus,
  FiEdit2,
  FiAlertCircle,
  FiAlertTriangle,
  FiUserX,
  FiUsers,
  FiSearch,
  FiUpload,
  FiDownload,
  FiX,
  FiCheck,
} from "react-icons/fi"
import { storeService } from "../../services/storeService"
import { useAuth } from "../../contexts/AuthContext"
import EmployeeForm from "../../components/EmployeeForm"
import WarningForm from "../../components/Forms/WarningForm"
import TerminationForm from "../../components/Forms/TerminationForm";
import { encryptId } from "../../utils/crypto"

function ImportCategory() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState("active")
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showTerminationForm, setShowTerminationForm] = useState(false)
  const { user } = useAuth()

  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const employeesPerPage = 10

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      let data = []
      data = await storeService.getAllCategories()
      setEmployees(data)
      setFilteredEmployees(data)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch employees")
      setLoading(false)
    }
  }, [activeView, user?.orgId])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    const filterEmployees = () => {
      const filtered = employees.filter((employee) => {
        console.log(employees);
        const fullName = `${employee.category_name}`.toLowerCase()
        console.log("Full Name "+fullName)
        return (
          fullName?.includes(searchQuery.toLowerCase()) ||
          employee?.category_name?.includes(searchQuery)
        )
      })
      setFilteredEmployees(filtered)
      setCurrentPage(1) // reset to first page on search change
    }

    filterEmployees()
  }, [searchQuery, employees])

  // Calculate pagination variables
  const indexOfLastEmployee = currentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  )
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleRowClick = (employee) => {
    navigate(`/onboarding/employee/${encryptId(employee.id)}`)
  }

  const handleAddEmployee = async () => {
    try {
      await fetchEmployees()
      setShowForm(false)
      setSelectedEmployee(null)
    } catch (error) {
      setError("Failed to add employee")
    }
  }

  const handleEdit = (e, id) => {
    e.stopPropagation()
    const employee = employees.find((emp) => emp.id === id)
    setSelectedEmployee(employee)
    setShowForm(true)
  }

  const handleIssueWarning = (e, employee) => {
    e.stopPropagation()
    setSelectedEmployee(employee)
    setShowWarningForm(true)
  }

  const handleTerminate = (e, employee) => {
    e.stopPropagation()
    setSelectedEmployee(employee)
    setShowTerminationForm(true)
  }

  const handleExportCategories = async () => {
    try {
      setIsExporting(true);
      const data = await storeService.exportCategories();
      const blob = new Blob(
        [data],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "categories.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (error) {
      console.error("Export error:", error);
      setError("Error exporting categories: " + (error.response?.status === 403 ? 
        "Permission denied. Please check your authorization." : 
        "An unexpected error occurred."));
    } finally {
      setIsExporting(false);
    }
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
      
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm">
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMigrateDialog(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            Migrate Data
          </button>
        </div>
      </div>

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
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
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
                    {[
                      "Category Name",
                      "Parent Category"
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
                  {currentEmployees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeView === "active" ? 6 : 5}
                        className="px-6 py-8 text-center text-gray-500 font-medium"
                      >
                        No {activeView === "active" ? "active" : "past"} categories found
                      </td>
                    </tr>
                  ) : (
                    currentEmployees.map((employee) => (
                      <motion.tr
                        key={employee.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => handleRowClick(employee)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">   
                            <div className="ml-4">
                              <div className="text-sm text-gray-900">
                                {employee.category_name} 
                              </div>
                              <div className="text-sm text-gray-500">{employee.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          {employee.leadProductType !== null ?
                            <div className="text-sm text-gray-900">
                              {employee.leadProductType.label || " "}
                            </div>
                            : null}
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
                    <h2 className="text-xl font-bold text-gray-900">Migrate Categories Data</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Export your current data or import new data
                    </p>
                  </div>
      
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FiDownload className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">Export Data</h3>
                          <p className="text-sm text-gray-500 mb-3">
                            Download your current categories data as Excel file
                          </p>
                          <button
                            onClick={handleExportCategories}
                            disabled={isExporting}
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${
                              isExporting ? "cursor-not-allowed" : ""
                            }`}
                          >
                            {isExporting ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Exporting...</span>
                              </div>
                            ) : (
                              <>
                                <FiDownload className="w-4 h-4 mr-2" />
                                Export Categories
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
      
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FiUpload className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">Import Data</h3>
                          <p className="text-sm text-gray-500 mb-3">
                            Upload new categories data from Excel file
                          </p>
                          <label
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 ${
                              isImporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              className="hidden"
                              disabled={isImporting}
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
      
                                try {
                                  setIsImporting(true)
                                  await storeService.importCategories(file)
                                  setShowMigrateDialog(false)
                                  setError(null)
                                  setSuccessMessage("Categories data imported successfully!")
                                  setTimeout(() => setSuccessMessage(null), 3000)
                                  fetchEmployees()
                                } catch (error) {
                                  setError("Error importing categories data. Please check your file and try again.")
                                } finally {
                                  setIsImporting(false)
                                }
                              }}
                            />
                            {isImporting ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Importing...</span>
                              </div>
                            ) : (
                              "Choose File & Import"
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
      
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
                      <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                        <li>Export your current data before importing new data</li>
                        <li>Make sure your import file follows the correct format</li>
                        <li>Only .xlsx or .xls files are supported</li>
                        <li>Maximum file size: 5MB</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

     

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <EmployeeForm
            employee={selectedEmployee}
            onClose={() => {
              setShowForm(false)
              setSelectedEmployee(null)
            }}
            onSubmit={handleAddEmployee}
          />
        )}
        {showWarningForm && (
          <WarningForm
            employee={selectedEmployee}
            onClose={() => {
              setShowWarningForm(false)
              setSelectedEmployee(null)
            }}
            onSubmit={fetchEmployees}
          />
        )}
        {showTerminationForm && (
          <TerminationForm
            employee={selectedEmployee}
            onClose={() => {
              setShowTerminationForm(false)
              setSelectedEmployee(null)
            }}
            onSubmit={fetchEmployees}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ImportCategory;