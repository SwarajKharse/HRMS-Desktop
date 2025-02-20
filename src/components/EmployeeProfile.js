import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiEdit2, FiAlertTriangle, FiUserX } from "react-icons/fi"
import { employeeService } from "../services/employeeService"
import EmployeeDetails from "./EmployeeProfile/EmployeeDetails"
import EmployeeAttendance from "./EmployeeProfile/EmployeeAttendance"
import EmployeeLeaves from "./EmployeeProfile/EmployeeLeaves"
import EmployeePayslips from "./EmployeeProfile/EmployeePayslips"
import EmployeeMissPunch from "./EmployeeProfile/EmployeeMissPunch"
import EmployeeWarnings from "./EmployeeProfile/EmployeeWarnings"
import EmployeeTermination from "./EmployeeProfile/EmployeeTermination"
import EmployeeResignation from "./EmployeeProfile/EmployeeResignation"
import EmployeePayrollReport from "./EmployeeProfile/EmployeePayrollReport"
import EmployeeForm from "./EmployeeForm"
import WarningForm from "./Forms/WarningForm"
import TerminationForm from "./Forms/TerminationForm"
import { decryptId } from "../utils/crypto"

function EmployeeProfile() {
  const { hash } = useParams()
  const employeeId = decryptId(decodeURIComponent(hash))
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("details")
  const [showForm, setShowForm] = useState(false)
  const [showWarningForm, setShowWarningForm] = useState(false)
  const [showTerminationForm, setShowTerminationForm] = useState(false)

  useEffect(() => {
    fetchEmployee()
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      setLoading(true)
      const data = await employeeService.getEmployeeById(employeeId)
      setEmployee(data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch employee details")
      setEmployee(null)
    } finally {
      setLoading(false)
    }
  }

  // New handler to toggle activation state.
  const handleToggleActivation = async () => {
    if (employee.empStatus === "Deactivated") {
      if (window.confirm("Are you sure you want to activate this employee?")) {
        try {
          await employeeService.activateEmployee(employee.id)
          fetchEmployee()
        } catch (err) {
          setError("Failed to activate employee")
        }
      }
    } else {
      if (window.confirm("Are you sure you want to deactivate this employee?")) {
        try {
          await employeeService.deactivateEmployee(employee.id)
          fetchEmployee()
        } catch (err) {
          setError("Failed to deactivate employee")
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-red-600 font-medium">{error || "Employee not found"}</div>
        <button
          onClick={() => navigate("/onboarding")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Employees
        </button>
      </div>
    )
  }

  const tabs = [
    { id: "details", label: "Details" },
    { id: "attendance", label: "Attendance" },
    { id: "leaves", label: "Leaves" },
    { id: "payslips", label: "Payslips" },
    { id: "miss-punch", label: "Miss Punch" },
    { id: "warnings", label: "Warnings" },
    { id: "termination", label: "Termination" },
    { id: "resignation", label: "Resignation" },
    { id: "reports", label: "Payroll Report" },
  ]

  const formatDate = (date) => {
    if (!date) return "-"
    const d = new Date(date)
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  }

  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return <EmployeeDetails employee={employee} formatDate={formatDate} />
      case "attendance":
        return <EmployeeAttendance employeeId={employee.id} />
      case "leaves":
        return <EmployeeLeaves employeeId={employee.id} />
      case "payslips":
        return <EmployeePayslips employeeId={employee.id} />
      case "miss-punch":
        return <EmployeeMissPunch employeeId={employee.id} />
      case "warnings":
        return <EmployeeWarnings employeeId={employee.id} />
      case "termination":
        return <EmployeeTermination employeeId={employee.id} />
      case "resignation":
        return <EmployeeResignation employeeId={employee.id} />
      case "reports":
        return <EmployeePayrollReport employeeId={employee.id} />
      default:
        return null
    }
  }

  const handleEdit = () => {
    setShowForm(true)
  }

  const handleIssueWarning = () => {
    setShowWarningForm(true)
  }

  const handleTerminate = () => {
    setShowTerminationForm(true)
  }

  const getStatusConfig = (status) => {
    const configs = {
      Active: {
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-200",
      },
      Resigned: {
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
      },
      Terminated: {
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
      },
      "Notice Period": {
        bgColor: "bg-orange-100",
        textColor: "text-orange-800",
        borderColor: "border-orange-200",
      },
      Deactivated: {
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
      },
    }
    return configs[status] || configs.Active
  }

  const isActionable = !employee.dateOfLeaving && employee.empStatus === "Active"
  const statusConfig = getStatusConfig(employee.empStatus)

  return (
    <div className="rounded-t-3xl overflow-hidden">
      <div className="max-w mx-auto px-4 sm:px-6 lg:px-4 py-4">
        {/* Employee Information Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-6">
              {/* Employee Avatar */}
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xl overflow-hidden">
                  {employee.profilePhotoUrl ? (
                    <img
                      src={employee.profilePhotoUrl || "/placeholder.svg"}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {employee.firstName?.[0]}
                      {employee.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
              </div>
              {/* Employee Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <span className="text-sm text-gray-500">#{employee.employeeCode}</span>
                </div>
                <div className="mt-1 text-sm text-gray-500 space-x-2">
                  <span>{employee.department?.name}</span>
                  <span>•</span>
                  <span>{employee.designation?.name}</span>
                  {employee.location && (
                    <>
                      <span>•</span>
                      <span>{employee.location}</span>
                    </>
                  )}
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Joined:</span> {formatDate(employee.dateOfJoining)}
                  </div>
                  {employee.dateOfLeaving && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Left:</span> {formatDate(employee.dateOfLeaving)}
                    </div>
                  )}
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
                  >
                    {employee.empStatus}
                    {employee.dateOfLeaving && ` • Left on ${formatDate(employee.dateOfLeaving)}`}
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiEdit2 className="w-4 h-4 mr-2" />
                  Edit Details
                </button>
                {isActionable && (
                  <>
                    <button
                      onClick={handleIssueWarning}
                      className="inline-flex items-center px-3 py-2 border border-yellow-200 rounded-lg text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      <FiAlertTriangle className="w-4 h-4 mr-2" />
                      Issue Warning
                    </button>
                    <button
                      onClick={handleTerminate}
                      className="inline-flex items-center px-3 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FiUserX className="w-4 h-4 mr-2" />
                      Terminate
                    </button>
                  </>
                )}
                {/* Activation Toggle Button */}
                <button
                  onClick={handleToggleActivation}
                  className="inline-flex items-center px-3 py-2 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {employee.empStatus === "Deactivated" ? "Activate" : "Deactivate"}
                </button>
              </div>
            </div>
          </div>
          {/* Navigation Tabs */}
          <div className="border-t">
            <div className="px-6 overflow-x-auto">
              <nav className="flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <EmployeeForm
            employee={employee}
            onClose={() => setShowForm(false)}
            onSubmit={() => {
              setShowForm(false)
              window.location.reload()
            }}
          />
        )}
        {showWarningForm && (
          <WarningForm
            employee={employee}
            onClose={() => setShowWarningForm(false)}
            onSubmit={() => {
              setShowWarningForm(false)
              window.location.reload()
            }}
          />
        )}
        {showTerminationForm && (
          <TerminationForm
            employee={employee}
            onClose={() => setShowTerminationForm(false)}
            onSubmit={() => {
              setShowTerminationForm(false)
              window.location.reload()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default EmployeeProfile;