import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiPlus, FiEdit2, FiAlertCircle, FiAlertTriangle, FiUserX, FiUsers } from "react-icons/fi"
import { employeeService } from "../services/employeeService"
import { useAuth } from "../contexts/AuthContext"
import EmployeeForm from "../components/EmployeeForm"
import EmployeeProfile from "../components/EmployeeProfile"
import WarningForm from "../components/Forms/WarningForm"
import TerminationForm from "../components/Forms/TerminationForm"

function Onboarding() {
  const [activeEmployees, setActiveEmployees] = useState([])
  const [pastEmployees, setPastEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showTerminationForm, setShowTerminationForm] = useState(false)
  const [activeView, setActiveView] = useState("active")
  const { user } = useAuth()

  useEffect(() => {
    fetchEmployees()
  }, [activeView]) // Removed activeView from dependencies

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      if (activeView === "active") {
        const data = await employeeService.getAllEmployees()
        setActiveEmployees(data.filter((emp) => emp.empStatus !== "Terminated" && emp.empStatus !== "Resigned"))
      } else {
        const data = await employeeService.getPastEmployeesByOrgId(user.orgId)
        setPastEmployees(data)
        console.log(data)
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e, id) => {
    e.stopPropagation() // Prevent row click
    try {
      setLoading(true)
      const employeeData = await employeeService.getEmployeeById(id)
      setSelectedEmployee(employeeData)
      setShowForm(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async () => {
    try {
      await fetchEmployees()
      setShowForm(false)
      setSelectedEmployee(null)
    } catch (err) {
      setError(err.message)
    }
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

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee)
    setShowProfile(true)
  }

  const currentEmployees = activeView === "active" ? activeEmployees : pastEmployees

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FiUsers className="text-blue-600 w-6 h-6" />
          <h1 className="text-2xl font-bold">Employee Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView("active")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "active" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Active Employees
            </button>
            <button
              onClick={() => setActiveView("past")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "past" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FiPlus className="mr-2" />
              Add Employee
            </motion.button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {activeView === "active" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={activeView === "active" ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                        No {activeView === "active" ? "active" : "past"} employees found
                      </td>
                    </tr>
                  ) : (
                    currentEmployees.map((employee) => (
                      <motion.tr
                        key={employee.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(employee)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center text-white">
                              {employee.profilePhotoUrl ? (
                                <img
                                  src={employee.profilePhotoUrl || "/placeholder.svg"}
                                  alt="Profile"
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span>
                                  {employee.firstName.charAt(0)}
                                  {employee.lastName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.workPhone}</div>
                          <div className="text-sm text-gray-500">{employee.personalEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.department?.name || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.designation?.name || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              employee.empStatus === "Active"
                                ? "bg-green-100 text-green-800"
                                : employee.empStatus === "Terminated"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {employee.empStatus}
                          </span>
                        </td>
                        {activeView === "active" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                onClick={(e) => handleEdit(e, employee.id)}
                                title="Edit"
                              >
                                <FiEdit2 size={18} />
                              </button>
                              <button
                                className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                onClick={(e) => handleIssueWarning(e, employee)}
                                title="Issue Warning"
                              >
                                <FiAlertTriangle size={18} />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900 transition-colors"
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
          </div>
        </motion.div>
      </AnimatePresence>

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