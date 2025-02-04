import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiPlus, FiEdit2, FiAlertCircle, FiAlertTriangle, FiUserX, FiUsers, FiSearch } from "react-icons/fi"
import { employeeService } from "../services/employeeService"
import { useAuth } from "../contexts/AuthContext"
import EmployeeForm from "../components/EmployeeForm"
import EmployeeProfile from "../components/EmployeeProfile"
import WarningForm from "../components/Forms/WarningForm"
import TerminationForm from "../components/Forms/TerminationForm"

function Onboarding() {
  const [loading, setLoading] = useState(true) // Added loading state
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState("active")
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showTerminationForm, setShowTerminationForm] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        const data = await employeeService.getAllEmployees()
        setEmployees(data)
        setFilteredEmployees(data)
        setLoading(false)
      } catch (error) {
        setError("Failed to fetch employees")
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  useEffect(() => {
    const filterEmployees = () => {
      const filtered = employees.filter((employee) => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
      })
      setFilteredEmployees(filtered)
    }

    filterEmployees()
  }, [searchQuery, employees])

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee)
    setShowProfile(true)
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

  const handleEdit = async (e, id) => {
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

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const data = await employeeService.getAllEmployees()
      setEmployees(data)
      setFilteredEmployees(data)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch employees")
      setLoading(false)
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
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <FiUsers className="text-indigo-600 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Employee Management
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveView("active")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === "active" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              Active Employees
            </button>
            <button
              onClick={() => setActiveView("past")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === "past" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              Past Employees
            </button>
          </div>
          {activeView === "active" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedEmployee(null)
                setShowForm(true)
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <FiPlus className="w-5 h-5" />
              Add Employee
            </motion.button>
          )}
        </div>
      </div>

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

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search employees by name..."
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
                      "Employee",
                      "Contact",
                      "Department",
                      "Designation",
                      "Status",
                      activeView === "active" && "Actions",
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
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeView === "active" ? 6 : 5}
                        className="px-6 py-8 text-center text-gray-500 font-medium"
                      >
                        No {activeView === "active" ? "active" : "past"} employees found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
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
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-medium text-lg shadow-sm">
                              {employee.profilePhotoUrl ? (
                                <img
                                  src={employee.profilePhotoUrl || "/placeholder.svg"}
                                  alt="Profile"
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <span>
                                  {employee.firstName.charAt(0)}
                                  {employee.lastName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{employee.workPhone}</div>
                          <div className="text-sm text-gray-500">{employee.personalEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{employee.department?.name || "-"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{employee.designation?.name || "-"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full
                            ${
                              employee.empStatus === "Active"
                                ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                : employee.empStatus === "Terminated"
                                  ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                  : "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20"
                            }`}
                          >
                            {employee.empStatus}
                          </span>
                        </td>
                        {activeView === "active" && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <button
                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                onClick={(e) => handleEdit(e, employee.id)}
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </button>
                              <button
                                className="text-gray-400 hover:text-yellow-600 transition-colors"
                                onClick={(e) => handleIssueWarning(e, employee)}
                                title="Issue Warning"
                              >
                                <FiAlertTriangle size={18} />
                              </button>
                              <button
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                onClick={(e) => handleTerminate(e, employee)}
                                title="Terminate"
                              >
                                <FiUserX size={18} />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

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
        {showProfile && (
          <EmployeeProfile
            employee={selectedEmployee}
            onClose={() => {
              setShowProfile(false)
              setSelectedEmployee(null)
            }}
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

export default Onboarding;