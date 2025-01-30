import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiDollarSign, FiAlertCircle, FiEdit2 } from "react-icons/fi"
import { employeeService } from "../../services/employeeService"
import { payrollPerEmployeeService } from "../../services/payrollPerEmployeeService"
import PayrollDialog from "../../components/PayrollDialog"
import { useAuth } from "../../contexts/AuthContext"

function EmployeePayroll() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [payrollData, setPayrollData] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees()
      setEmployees(data)
      setError(null)
    } catch (err) {
      setError("Failed to load employees")
    } finally {
      setLoading(false)
    }
  }

  const handleEditPayroll = async (employee) => {
    try {
      setSelectedEmployee(employee)
      const payroll = await payrollPerEmployeeService.getPayrollByEmployee(employee.id)
      setPayrollData(payroll)
      setShowDialog(true)
    } catch (err) {
      setError("Failed to load payroll details")
    }
  }

  const handleSubmitPayroll = async (payrollData) => {
    try {
      await payrollPerEmployeeService.createOrUpdatePayroll(payrollData)
      setShowDialog(false)
      setSelectedEmployee(null)
      setPayrollData(null)
    } catch (err) {
      throw new Error("Failed to save payroll details")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiDollarSign className="text-blue-600 w-6 h-6" />
          <h1 className="text-2xl font-bold">Employee Payroll Settings</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <motion.tr
                    key={employee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
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
                      <div className="text-sm text-gray-900">{employee.department?.name || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.designation?.name || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.employeeId || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditPayroll(employee)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showDialog && selectedEmployee && (
          <PayrollDialog
            employee={selectedEmployee}
            payroll={payrollData}
            onClose={() => {
              setShowDialog(false)
              setSelectedEmployee(null)
              setPayrollData(null)
            }}
            onSubmit={handleSubmitPayroll}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default EmployeePayroll;