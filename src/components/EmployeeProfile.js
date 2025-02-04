import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiX } from "react-icons/fi"
import EmployeeDetails from "./EmployeeProfile/EmployeeDetails"
import EmployeeAttendance from "./EmployeeProfile/EmployeeAttendance"
import EmployeeLeaves from "./EmployeeProfile/EmployeeLeaves"
import EmployeePayslips from "./EmployeeProfile/EmployeePayslips"
import EmployeeMissPunch from "./EmployeeProfile/EmployeeMissPunch"
import EmployeeWarnings from "./EmployeeProfile/EmployeeWarnings"
import EmployeeTermination from "./EmployeeProfile/EmployeeTermination"
import EmployeeResignation from "./EmployeeProfile/EmployeeResignation"

function EmployeeProfile({ employee, onClose }) {
  const [activeTab, setActiveTab] = useState("details")

  if (!employee) return null

  const tabs = [
    { id: "details", label: "Details" },
    { id: "attendance", label: "Attendance" },
    { id: "leaves", label: "Leaves" },
    { id: "payslips", label: "Payslips" },
    { id: "miss-punch", label: "Miss Punch" },
    { id: "warnings", label: "Warnings" },
    { id: "termination", label: "Termination" },
    { id: "resignation", label: "Resignation" },
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
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Employee Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Fixed Employee Information Header */}
        <div className="bg-gray-50 border-b">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 rounded-full bg-blue-900 flex items-center justify-center text-white text-xl overflow-hidden">
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
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h3>
                <div className="mt-1 text-sm text-gray-500">
                  {employee.department?.name} • {employee.designation?.name}
                </div>
                <div className="mt-2">
                  <span
                    className={`px-3 py-1 inline-flex text-sm font-medium rounded-full ${
                      employee.empStatus === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {employee.empStatus || "Status Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 overflow-x-auto">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

        {/* Content Area */}
        <div className="p-6 max-h-[calc(100vh-350px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default EmployeeProfile;